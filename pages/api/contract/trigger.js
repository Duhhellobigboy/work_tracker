// Temporarily disabled feature Contract Assessment safe to restore later
import { readFile, unlink } from 'fs/promises'
import formidable from 'formidable'
import { getRequestAuth } from '../../../lib/api-auth'
import { normalizeAssessment } from '../../../lib/contract/normalizeAssessment'
import {
  postContractCsvToN8nWebhook,
  resolveContractN8nWebhookUrl,
} from '../../../lib/contract/n8nWebhook'
import { getContractServiceSupabase } from '../../../lib/supabase-contract-server'

export const config = {
  api: {
    bodyParser: false,
  },
}

const CSV_MIME = new Set(['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'])
const ENABLE_CONTRACT_ASSESSMENT = false

function isCsvFile(file) {
  const name = (file.originalFilename || file.newFilename || '').toLowerCase()
  if (!name.endsWith('.csv')) return false
  const mime = (file.mimetype || '').toLowerCase()
  if (!mime) return true
  return CSV_MIME.has(mime)
}

function parseMultipart(req) {
  const form = formidable({
    maxFileSize: 25 * 1024 * 1024,
    allowEmptyFiles: false,
  })
  return form.parse(req)
}

export default async function handler(req, res) {
  if (!ENABLE_CONTRACT_ASSESSMENT) {
    return res.status(404).json({ error: 'Not found' })
  }
  if (req.method === 'GET') return handleGet(req, res)
  if (req.method === 'POST') return handlePost(req, res)
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

/** PostgREST / Postgres error when `user_id` is not on the table yet (before migration). */
function isMissingUserIdColumnError(error) {
  if (!error) return false
  const msg = String(error.message || error.details || '')
  const code = error.code
  return (
    (msg.includes('user_id') && msg.includes('does not exist')) ||
    (code === '42703' && msg.includes('user_id'))
  )
}

async function selectLatestAssessment(contractDb, userId) {
  if (userId) {
    const withUser = await contractDb
      .from('contract_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!withUser.error) return withUser
    if (!isMissingUserIdColumnError(withUser.error)) return withUser
  }

  return contractDb
    .from('contract_assessments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

async function selectAssessmentByJob(contractDb, jobId, userId) {
  const base = contractDb.from('contract_assessments').select('*').eq('job_id', jobId)

  if (userId) {
    const withUser = await base.eq('user_id', userId).maybeSingle()
    if (!withUser.error) return withUser
    if (!isMissingUserIdColumnError(withUser.error)) return withUser
  }

  return contractDb.from('contract_assessments').select('*').eq('job_id', jobId).maybeSingle()
}

/**
 * Reserve the job row early so polling + reads are scoped by user_id once the column exists.
 * n8n should upsert/update the same row by job_id (not insert a duplicate).
 */
async function seedPendingAssessmentJob(contractDb, { jobId, userId, projectName, filename }) {
  const baseRow = {
    job_id: jobId,
    project_name: projectName || null,
    original_filename: filename || null,
    status: 'pending',
    updated_at: new Date().toISOString(),
  }

  let row = { ...baseRow }
  if (userId) row.user_id = userId

  let result = await contractDb
    .from('contract_assessments')
    .upsert(row, { onConflict: 'job_id' })

  if (result.error && userId && isMissingUserIdColumnError(result.error)) {
    row = { ...baseRow }
    result = await contractDb.from('contract_assessments').upsert(row, { onConflict: 'job_id' })
  }

  return result
}

async function handleGet(req, res) {
  const auth = await getRequestAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const { user } = auth
  let contractDb
  try {
    contractDb = getContractServiceSupabase()
  } catch (e) {
    return res.status(503).json({ error: e.message || 'Contract Supabase is not configured' })
  }

  const userId = user?.id ?? null

  if (req.query.latest === '1' || req.query.latest === 'true') {
    const { data, error } = await selectLatestAssessment(contractDb, userId)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ assessment: data })
  }

  const jobId = req.query.job_id
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'job_id or latest=1 is required' })
  }

  const { data, error } = await selectAssessmentByJob(contractDb, jobId, userId)
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ assessment: data })
}

async function handlePost(req, res) {
  const auth = await getRequestAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const { user } = auth
  const resolvedWebhookUrl = resolveContractN8nWebhookUrl(process.env.N8N_WEBHOOK_URL || '')
  if (!resolvedWebhookUrl) {
    return res.status(503).json({
      error: 'Contract assessment webhook is not configured (N8N_WEBHOOK_URL).',
    })
  }

  const apiKey = process.env.N8N_API_KEY || ''

  let fields
  let files
  try {
    ;[fields, files] = await parseMultipart(req)
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Invalid multipart body' })
  }

  const jobId = fields.job_id?.[0]
  const projectName = fields.project_name?.[0] ?? ''
  const file = files.file?.[0]

  if (!jobId) {
    return res.status(400).json({ error: 'job_id is required' })
  }
  if (!file) {
    return res.status(400).json({ error: 'CSV file is required (field name: file)' })
  }
  if (!isCsvFile(file)) {
    return res.status(400).json({ error: 'Only .csv files are accepted' })
  }

  let buffer
  try {
    buffer = await readFile(file.filepath)
  } catch (e) {
    return res.status(500).json({ error: 'Failed to read uploaded file' })
  } finally {
    unlink(file.filepath).catch(() => {})
  }

  let contractDb
  try {
    contractDb = getContractServiceSupabase()
  } catch {
    contractDb = null
  }

  if (contractDb) {
    await seedPendingAssessmentJob(contractDb, {
      jobId,
      userId: user?.id ?? null,
      projectName,
      filename: file.originalFilename || 'contracts.csv',
    })
  }

  let webhook
  try {
    webhook = await postContractCsvToN8nWebhook({
      webhookUrl: process.env.N8N_WEBHOOK_URL || '',
      apiKey: apiKey || undefined,
      jobId,
      userId: user.id,
      projectName,
      buffer,
      filename: file.originalFilename || 'contracts.csv',
    })
  } catch (e) {
    return res.status(502).json({
      error: 'Webhook request failed',
      detail: e.message || 'Network error',
    })
  }

  const webhookPreview = normalizeAssessment(webhook.json ?? null)
  const payload = {
    jobId,
    webhookStatus: webhook.status,
    webhookOk: webhook.ok,
    webhookPreview,
  }

  if (!webhook.ok) {
    return res.status(502).json({
      error: 'n8n webhook returned an error',
      ...payload,
      webhookBodySnippet: (webhook.text || '').slice(0, 400),
    })
  }

  // Sync success from Respond to Webhook; client still polls Supabase for persisted row.
  return res.status(200).json(payload)
}
