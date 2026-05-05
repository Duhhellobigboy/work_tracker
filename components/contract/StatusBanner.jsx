export default function StatusBanner({ phase, message }) {
  if (phase === 'idle' || !phase) return null

  if (phase === 'uploading') {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-blue-800/60 bg-blue-950/40 px-4 py-3 text-sm text-blue-200">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        <span>Uploading file…</span>
      </div>
    )
  }

  if (phase === 'processing') {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        <span>Processing… this may take a moment.</span>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="mb-6 rounded-xl border border-red-800/70 bg-red-950/40 px-4 py-3 text-sm text-red-200">
        {message || 'Something went wrong.'}
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="mb-6 rounded-xl border border-emerald-800/60 bg-emerald-950/35 px-4 py-3 text-sm text-emerald-200">
        {message || 'Assessment ready.'}
      </div>
    )
  }

  return null
}
