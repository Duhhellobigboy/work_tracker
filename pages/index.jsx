import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getBrowserSupabase } from '../lib/supabase-browser'
import DashboardLayout from '../components/layout/DashboardLayout'

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

function TaskCard({ task, busyId, onDone, onSnooze, onEdit, isEditing, onEditSubmit, onEditCancel }) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue = task.status === 'pending' && task.due_date < today
  const border = overdue ? 'border-red-800 bg-red-950/30' : 'border-gray-800 bg-gray-900'

  const [editTitle, setEditTitle] = useState(task.title || '')
  const [editUrgency, setEditUrgency] = useState(task.urgency || 'non-urgent')
  const [editDueBucket, setEditDueBucket] = useState(task.due_bucket || '1_week')

  const urgencyColors = {
    urgent: 'bg-orange-900/60 text-orange-300',
    'non-urgent': 'bg-slate-800 text-slate-300',
    severe: 'bg-rose-900 text-rose-200 font-bold'
  }

  if (isEditing) {
    return (
      <div className={`flex flex-col gap-3 p-4 rounded-xl border ${border}`}>
        <input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-full"
          placeholder="Task title"
        />
        <div className="flex gap-2 text-sm">
          <select value={editUrgency} onChange={e => setEditUrgency(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5">
            <option value="non-urgent">Non-Urgent</option>
            <option value="urgent">Urgent</option>
            <option value="severe">Severe</option>
          </select>
          <select value={editDueBucket} onChange={e => setEditDueBucket(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5">
            <option value="3_days">3 Days</option>
            <option value="1_week">1 Week</option>
            <option value="2_weeks">2 Weeks</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEditSubmit(task.id, editTitle, editUrgency, editDueBucket)} className="text-xs px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded-lg">Save</button>
          <button onClick={onEditCancel} className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${border}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">{task.title}</p>
          {task.urgency && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${urgencyColors[task.urgency] || urgencyColors['non-urgent']}`}>
              {task.urgency.replace('-', ' ')}
            </span>
          )}
          {task.due_bucket && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300">
              {task.due_bucket.replace('_', ' ')}
            </span>
          )}
        </div>
        <p className={`text-xs mt-0.5 ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
          Due: {task.due_date}{overdue ? ' — overdue' : ''}
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
          <button
            onClick={() => onEdit(task.id)}
            disabled={!!busyId}
            className="text-xs px-3 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 rounded-lg transition-colors"
          >
            Edit
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
  const [urgency, setUrgency]   = useState('non-urgent')
  const [dueBucket, setDueBucket] = useState('1_week')
  
  const [adding, setAdding]     = useState(false)
  const [busyId, setBusyId]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notice, setNotice]     = useState({ msg: '', type: 'success' })
  const [editingTaskId, setEditingTaskId] = useState(null)

  function flash(msg, type = 'success') {
    setNotice({ msg, type })
    setTimeout(() => setNotice({ msg: '', type: 'success' }), 4000)
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
    setUrgency('non-urgent')
    setDueBucket('1_week')
    try {
      await apiFetchWithAuth('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ input: text, urgency, due_bucket: dueBucket }),
      })
      await fetchTasks()
      flash('Task added!')
    } catch (e) {
      flash(e.message, 'error')
      // Restore input on failure
      setInput(text)
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

  // POST /api/tasks/update action=edit
  async function handleEditSubmit(task_id, title, newUrgency, newDueBucket) {
    if (!title.trim()) {
      flash('Title cannot be empty', 'error');
      return;
    }
    setBusyId(task_id + '_edit')
    try {
      await apiFetchWithAuth('/api/tasks/update', {
        method: 'POST',
        body: JSON.stringify({ task_id, action: 'edit', title, urgency: newUrgency, due_bucket: newDueBucket }),
      })
      flash('Task updated!')
      setEditingTaskId(null)
      await fetchTasks()
    } catch (e) {
      flash(e.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const pending = tasks.filter(t => t.status === 'pending')
  const done    = tasks.filter(t => t.status === 'done')

  return (
    <DashboardLayout session={session}>
      <div className="mb-6 flex items-start justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Upcoming Tasks</h1>
          <p className="text-gray-500 text-sm">Procurement RFP tracker</p>
        </div>
      </div>

      <Notice {...notice} />

      {/* Add task */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-10">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. Finish janitorial RFP tomorrow"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <select 
          value={urgency} 
          onChange={e => setUrgency(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white"
        >
          <option value="non-urgent">Non-Urgent</option>
          <option value="urgent">Urgent</option>
          <option value="severe">Severe</option>
        </select>
        <select 
          value={dueBucket} 
          onChange={e => setDueBucket(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 text-white"
        >
          <option value="3_days">3 Days</option>
          <option value="1_week">1 Week</option>
          <option value="2_weeks">2 Weeks</option>
        </select>
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
              <TaskCard 
                key={t.id} 
                task={t} 
                busyId={busyId} 
                onDone={handleDone} 
                onSnooze={handleSnooze} 
                onEdit={setEditingTaskId}
                isEditing={editingTaskId === t.id}
                onEditSubmit={handleEditSubmit}
                onEditCancel={() => setEditingTaskId(null)}
              />
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
              <TaskCard 
                key={t.id} 
                task={t} 
                busyId={busyId} 
                onDone={handleDone} 
                onSnooze={handleSnooze} 
                onEdit={setEditingTaskId}
                isEditing={editingTaskId === t.id}
                onEditSubmit={handleEditSubmit}
                onEditCancel={() => setEditingTaskId(null)}
              />
            ))}
          </div>
        </section>
      )}

    </DashboardLayout>
  )
}
