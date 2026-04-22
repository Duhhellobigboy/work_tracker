import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getBrowserSupabase } from '../lib/supabase-browser'

const supabase = getBrowserSupabase()

async function apiFetch(path, options = {}, accessToken) {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Notice({ msg, type }) {
  if (!msg) return null
  const c = type === 'error'
    ? 'bg-red-900/50 border-red-700 text-red-300'
    : 'bg-emerald-900/50 border-emerald-700 text-emerald-300'
  return <div className={`px-4 py-2.5 rounded-lg border text-sm mb-5 ${c}`}>{msg}</div>
}

function Badge({ status }) {
  return status === 'done'
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 font-medium">done</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900 text-amber-300 font-medium">pending</span>
}

function TaskCard({ task, busyId, onDone, onSnooze }) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue = task.status === 'pending' && task.due_date < today
  const border = overdue ? 'border-red-800 bg-red-950/30' : 'border-gray-800 bg-gray-900'

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${border}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{task.task}</p>
        <p className={`text-xs mt-0.5 ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
          {task.due_date}{overdue ? ' — overdue' : ''}
        </p>
      </div>

      <Badge status={task.status} />

      {task.status === 'pending' && (
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => onDone(task.id)}
            disabled={!!busyId}
            className="text-xs px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 rounded-lg transition-colors"
          >
            {busyId === task.id + '_done' ? '…' : 'Done'}
          </button>
          <button
            onClick={() => onSnooze(task.id)}
            disabled={!!busyId}
            className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-lg transition-colors"
          >
            {busyId === task.id + '_snooze' ? '…' : 'Snooze 2d'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home({ session }) {
  const router = useRouter()
  const [tasks, setTasks]       = useState([])
  const [input, setInput]       = useState('')
  const [adding, setAdding]     = useState(false)
  const [busyId, setBusyId]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notice, setNotice]     = useState({ msg: '', type: 'success' })

  function flash(msg, type = 'success') {
    setNotice({ msg, type })
    setTimeout(() => setNotice({ msg: '', type: 'success' }), 3500)
  }

  async function apiFetchWithAuth(path, options = {}) {
    const token = session?.access_token
    return apiFetch(path, options, token)
  }

  // GET /api/tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const { tasks } = await apiFetchWithAuth('/api/tasks')
      setTasks(tasks)
    } catch (e) {
      flash(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // POST /api/tasks
  async function handleAdd(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setAdding(true)
    setInput('')
    try {
      await apiFetchWithAuth('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ input: text }),
      })
      await fetchTasks()
      flash('Task added!')
    } catch (e) {
      flash(e.message, 'error')
    } finally {
      setAdding(false)
    }
  }

  // POST /api/tasks/update  action=done
  async function handleDone(task_id) {
    setBusyId(task_id + '_done')
    try {
      await apiFetchWithAuth('/api/tasks/update', {
        method: 'POST',
        body: JSON.stringify({ task_id, action: 'done' }),
      })
      flash('Marked as done!')
      await fetchTasks()
    } catch (e) {
      flash(e.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  // POST /api/tasks/update  action=snooze
  async function handleSnooze(task_id) {
    setBusyId(task_id + '_snooze')
    try {
      await apiFetchWithAuth('/api/tasks/update', {
        method: 'POST',
        body: JSON.stringify({ task_id, action: 'snooze', days: 2 }),
      })
      flash('Snoozed 2 days!')
      await fetchTasks()
    } catch (e) {
      flash(e.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      flash(e.message, 'error')
    }
  }

  const pending = tasks.filter(t => t.status === 'pending')
  const done    = tasks.filter(t => t.status === 'done')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="mb-8 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">Task Manager</h1>
            <p className="text-gray-500 text-sm">Procurement RFP tracker</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-gray-800"
          >
            Log out
          </button>
        </div>

        <Notice {...notice} />

        {/* Add task */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-10">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. Finish janitorial RFP tomorrow"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={adding || !input.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors min-w-[90px]"
          >
            {adding ? 'Parsing…' : 'Add Task'}
          </button>
        </form>

        {/* Pending */}
        <section className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
            Pending ({pending.length})
          </p>
          {loading ? (
            <p className="text-gray-600 text-sm">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-gray-600 text-sm">No pending tasks.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.map(t => (
                <TaskCard key={t.id} task={t} busyId={busyId} onDone={handleDone} onSnooze={handleSnooze} />
              ))}
            </div>
          )}
        </section>

        {/* Done */}
        {done.length > 0 && (
          <section className="opacity-60">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
              Completed ({done.length})
            </p>
            <div className="flex flex-col gap-2">
              {done.map(t => (
                <TaskCard key={t.id} task={t} busyId={busyId} onDone={handleDone} onSnooze={handleSnooze} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
