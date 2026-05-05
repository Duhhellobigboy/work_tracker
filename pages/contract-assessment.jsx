// Temporarily disabled feature Contract Assessment safe to restore later
import { useCallback, useEffect, useRef, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import UploadForm from '../components/contract/UploadForm'
import StatusBanner from '../components/contract/StatusBanner'
import AssessmentResults from '../components/contract/AssessmentResults'
import {
  mergeAssessmentPreferComplete,
  normalizeAssessment,
} from '../lib/contract/normalizeAssessment'
import { getContractBrowserSupabase } from '../lib/supabase-contract-browser'

const POLL_MS = 3000
const POLL_MAX = 40
const ENABLE_CONTRACT_ASSESSMENT = false

async function jsonFetch(url, options = {}, token) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Request failed')
  }
  return data
}

function rowUsable(row) {
  if (!row) return false
  if (row.status === 'done') return true
  return !!(
    row.summary_text ||
    row.most_important_document ||
    (Array.isArray(row.top_urgent_items) && row.top_urgent_items.length) ||
    (Array.isArray(row.recommended_actions) && row.recommended_actions.length)
  )
}

export default function ContractAssessmentPage({ session }) {
  const [phase, setPhase] = useState('idle')
  const [bannerMsg, setBannerMsg] = useState('')
  const [displayResult, setDisplayResult] = useState(null)
  const [loadingLatest, setLoadingLatest] = useState(true)

  const pollRef = useRef(null)
  const triesRef = useRef(0)

  const token = session?.access_token

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    triesRef.current = 0
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  useEffect(() => {
    try {
      getContractBrowserSupabase()
    } catch {
      /* Missing NEXT_PUBLIC_CONTRACT_* — API reads will 503 until configured */
    }
  }, [])

  const loadLatest = useCallback(async () => {
    if (!token) return
    setLoadingLatest(true)
    try {
      const data = await jsonFetch('/api/contract/trigger?latest=1', { method: 'GET' }, token)
      const n = normalizeAssessment(data.assessment)
      setDisplayResult(n)
    } catch {
      setDisplayResult(null)
    } finally {
      setLoadingLatest(false)
    }
  }, [token])

  useEffect(() => {
    loadLatest()
  }, [loadLatest])

  async function handleSubmit({ file, projectName }) {
    stopPolling()
    setBannerMsg('')

    const jobId = crypto.randomUUID()
    setPhase('uploading')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('job_id', jobId)
    formData.append('project_name', projectName)

    let webhookPreview = null
    try {
      const res = await fetch('/api/contract/trigger', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = [data.error, data.webhookBodySnippet].filter(Boolean).join(' — ')
        throw new Error(detail || 'Upload failed')
      }
      webhookPreview = data.webhookPreview
      if (webhookPreview && Object.values(webhookPreview).some(Boolean)) {
        const enriched = {
          ...webhookPreview,
          project_name: projectName || webhookPreview.project_name,
          job_id: jobId,
        }
        setDisplayResult(mergeAssessmentPreferComplete(null, enriched))
      }
      setPhase('processing')
    } catch (e) {
      setPhase('error')
      setBannerMsg(e.message)
      return
    }

    triesRef.current = 0
    pollRef.current = setInterval(async () => {
      triesRef.current += 1
      try {
        const data = await jsonFetch(
          `/api/contract/trigger?job_id=${encodeURIComponent(jobId)}`,
          { method: 'GET' },
          token,
        )
        const row = data.assessment
        if (rowUsable(row)) {
          stopPolling()
          const normalized = normalizeAssessment(row)
          setDisplayResult((prev) =>
            mergeAssessmentPreferComplete(
              mergeAssessmentPreferComplete(prev, webhookPreview),
              normalized,
            ),
          )
          setPhase('done')
          setBannerMsg('Results loaded.')
          setTimeout(() => {
            setPhase('idle')
            setBannerMsg('')
          }, 2800)
        } else if (triesRef.current >= POLL_MAX) {
          stopPolling()
          const hasPreview = webhookPreview && Object.values(webhookPreview).some(Boolean)
          if (hasPreview) {
            setPhase('done')
            setBannerMsg('Saved row not found yet; showing analysis from the webhook response. Refresh later to load from storage.')
            setTimeout(() => {
              setPhase('idle')
              setBannerMsg('')
            }, 5000)
          } else {
            setPhase('error')
            setBannerMsg(
              'Still processing after several minutes. Your workflow may be slow or the Supabase table may be missing — run sql/contract_assessment_schema.sql if you have not already.',
            )
          }
        }
      } catch (e) {
        stopPolling()
        setPhase('error')
        setBannerMsg(e.message)
      }
    }, POLL_MS)
  }

  const busy = phase === 'uploading' || phase === 'processing'

  return (
    <DashboardLayout session={session} mainClassName="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8 border-b border-gray-800 pb-5">
        <h1 className="text-2xl font-bold text-white mb-1">Contract Assessment</h1>
        <p className="text-gray-500 text-sm">
          Upload a CSV to run your n8n workflow. Results sync from the webhook response and from Supabase when available.
        </p>
      </div>

      <StatusBanner phase={phase} message={bannerMsg} />

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <UploadForm disabled={busy} onSubmit={handleSubmit} />
        </div>
        <div className="lg:col-span-3">
          {loadingLatest && phase === 'idle' && !displayResult ? (
            <p className="text-sm text-gray-500">Loading latest results…</p>
          ) : null}
          <AssessmentResults
            result={displayResult}
            title="Assessment results"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export async function getServerSideProps() {
  if (!ENABLE_CONTRACT_ASSESSMENT) {
    return { notFound: true }
  }
  return { props: {} }
}
