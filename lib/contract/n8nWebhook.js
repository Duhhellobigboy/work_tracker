/**
 * Server-only: forwards multipart data to n8n production webhook.
 * Uses N8N_WEBHOOK_URL (trimmed; /webhook-test/ → /webhook/) and optional N8N_API_KEY.
 */

/** Use env URL as-is after trim; map n8n test listener URLs to production webhooks. */
export function resolveContractN8nWebhookUrl(raw) {
  if (raw == null || typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return trimmed.replace(/\/webhook-test(\/|$)/, '/webhook$1')
}

export async function postContractCsvToN8nWebhook({
  webhookUrl,
  apiKey,
  jobId,
  userId,
  projectName,
  buffer,
  filename,
}) {
  const url = resolveContractN8nWebhookUrl(webhookUrl)
  if (!url) {
    throw new Error('Webhook URL is missing or invalid')
  }

  const formData = new FormData()
  const blob = new Blob([buffer], { type: 'text/csv' })
  formData.append('file', blob, filename || 'contracts.csv')
  formData.append('job_id', jobId)
  formData.append('project_name', projectName ?? '')
  formData.append('user_id', userId != null ? String(userId) : '')

  const headers = {}
  if (apiKey) headers['x-api-key'] = apiKey

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  })

  const text = await res.text()
  let json = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }
  }

  return { ok: res.ok, status: res.status, text, json }
}
