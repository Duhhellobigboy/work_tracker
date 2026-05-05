function unwrapPayload(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (raw.data != null && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return raw.data
  }
  return raw
}

function coerceArray(value) {
  if (value == null) return null
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    const lines = value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    return lines.length ? lines : null
  }
  return null
}

/**
 * Shapes webhook or DB rows into a consistent object for the UI.
 * Supports snake_case (DB) and common camelCase variants.
 */
export function normalizeAssessment(raw) {
  const r = unwrapPayload(raw)
  if (!r || typeof r !== 'object') return null

  return {
    summary_text: r.summary_text ?? r.summaryText ?? null,
    most_important_document: (() => {
      const v = r.most_important_document ?? r.mostImportantDocument ?? null
      return v != null && typeof v === 'object' ? JSON.stringify(v) : v
    })(),
    top_urgent_items: coerceArray(r.top_urgent_items ?? r.topUrgentItems),
    recommended_actions: coerceArray(r.recommended_actions ?? r.recommendedActions),
    counts: r.counts != null && typeof r.counts === 'object' && !Array.isArray(r.counts)
      ? r.counts
      : null,
    status: r.status ?? null,
    job_id: r.job_id ?? r.jobId ?? null,
    project_name: r.project_name ?? r.projectName ?? null,
  }
}

/** Merge assessment-shaped objects; later keys from `next` win (e.g. Supabase over webhook preview). */
export function mergeAssessmentPreferComplete(prev, next) {
  if (!next) return prev
  if (!prev) return next
  return { ...prev, ...next }
}
