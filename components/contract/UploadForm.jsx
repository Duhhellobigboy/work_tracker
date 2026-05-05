import { useState } from 'react'

function isCsvFile(file) {
  if (!file) return false
  const name = file.name.toLowerCase()
  return name.endsWith('.csv')
}

export default function UploadForm({ disabled, onSubmit }) {
  const [projectName, setProjectName] = useState('')
  const [file, setFile] = useState(null)
  const [localError, setLocalError] = useState('')

  function onFileChange(e) {
    setLocalError('')
    const f = e.target.files?.[0]
    if (!f) {
      setFile(null)
      return
    }
    if (!isCsvFile(f)) {
      setFile(null)
      setLocalError('Please choose a .csv file.')
      e.target.value = ''
      return
    }
    setFile(f)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setLocalError('')
    if (!file) {
      setLocalError('Select a CSV file to continue.')
      return
    }
    onSubmit({ file, projectName: projectName.trim() })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6 space-y-5"
    >
      <div>
        <label htmlFor="contract-project" className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          Project / workspace (optional)
        </label>
        <input
          id="contract-project"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={disabled}
          placeholder="e.g. Q2 vendor review"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="contract-csv" className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          CSV file
        </label>
        <input
          id="contract-csv"
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          disabled={disabled}
          className="block w-full text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-600 disabled:opacity-50"
        />
        <p className="mt-2 text-xs text-gray-500">Only .csv files are accepted. PDF support can be added later.</p>
      </div>

      {localError && (
        <p className="text-sm text-red-300">{localError}</p>
      )}

      <button
        type="submit"
        disabled={disabled || !file}
        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors"
      >
        {disabled ? 'Working…' : 'Analyse contracts'}
      </button>
    </form>
  )
}
