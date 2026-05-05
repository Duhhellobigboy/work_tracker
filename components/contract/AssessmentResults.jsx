function formatCounts(counts) {
  if (!counts || typeof counts !== 'object') return null
  const parts = Object.entries(counts)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
  return parts.length ? parts : null
}

export default function AssessmentResults({ result, title = 'Latest assessment' }) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-8 text-center text-sm text-gray-500">
        Run an analysis to see summary, urgent items, and recommended actions here.
      </div>
    )
  }

  const countsLine = formatCounts(result.counts)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {result.project_name && (
            <p className="text-sm text-gray-500 mt-1">Project: {result.project_name}</p>
          )}
        </div>
        {countsLine && (
          <div className="flex flex-wrap gap-2">
            {countsLine.map((label) => (
              <span
                key={label}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {result.summary_text && (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Summary</h3>
          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{result.summary_text}</p>
        </section>
      )}

      {result.most_important_document && (
        <section className="rounded-2xl border border-blue-900/50 bg-blue-950/25 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-300/80 mb-2">
            Most important document
          </h3>
          <p className="text-sm text-blue-100 font-medium">{result.most_important_document}</p>
        </section>
      )}

      {result.top_urgent_items?.length > 0 && (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Top urgent items</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-200">
            {result.top_urgent_items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {result.recommended_actions?.length > 0 && (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Recommended actions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-200">
            {result.recommended_actions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
