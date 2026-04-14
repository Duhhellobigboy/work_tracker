import { useState } from 'react'
import { WEBHOOK_URL, USER_ID } from './config'

const MOCK_TASKS = [
  { id: '1', task: 'Finish janitorial RFP', due_date: '2026-04-13', status: 'pending' },
  { id: '2', task: 'Follow up with vendor', due_date: '2026-04-15', status: 'pending' },
  { id: '3', task: 'Review security contract', due_date: '2026-04-10', status: 'done' },
]

async function post(payload) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json().catch(() => ({}))
}

function Notice({ msg, type }) {
  if (!msg) return null
  const colors = type === 'error'
    ? 'bg-red-900/50 border-red-700 text-red-300'
    : 'bg-emerald-900/50 border-emerald-700 text-emerald-300'
  return (
    <div className={`px-4 py-2.5 rounded-lg border text-sm mb-4 ${colors}`}>
      {msg}
    </div>
  )
}

function Badge({ status }) {
  return status === 'done'
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 font-medium">done</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900 text-amber-300 font-medium">pending</span>
}

export default function App() {
  const [tasks, setTasks] = useState(MOCK_TASKS)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // task id
  const [notice, setNotice] = useState({ msg: '', type: 'success' })

  function flash(msg, type = 'success') {
    setNotice({ msg, type })
    setTimeout(() => setNotice({ msg: '', type: 'success' }), 3000)
  }

  async function handleAddTask(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setLoading(true)
    try {
      await post({ type: 'create_task', user_id: USER_ID, input: text })
      setTasks(prev => [
        {
          id: Date.now().toString(),
          task: text,
          due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          status: 'pending',
        },
        ...prev,
      ])
      setInput('')
      flash('Task added!')
    } catch {
      flash('Failed to add task.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDone(task_id) {
    setActionLoading(task_id + '_done')
    try {
      await post({ type: 'command', task_id, action: 'done' })
      setTasks(prev => prev.map(t => t.id === task_id ? { ...t, status: 'done' } : t))
      flash('Marked as done!')
    } catch {
      flash('Action failed.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSnooze(task_id) {
    setActionLoading(task_id + '_snooze')
    try {
      await post({ type: 'command', task_id, action: 'snooze', days: 2 })
      setTasks(prev => prev.map(t => {
        if (t.id !== task_id) return t
        const d = new Date(t.due_date)
        d.setDate(d.getDate() + 2)
        return { ...t, due_date: d.toISOString().slice(0, 10) }
      }))
      flash('Snoozed 2 days!')
    } catch {
      flash('Action failed.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const pending = tasks.filter(t => t.status === 'pending')
  const done    = tasks.filter(t => t.status === 'done')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        <h1 className="text-2xl font-bold mb-1">Task Manager</h1>
        <p className="text-gray-500 text-sm mb-8">Procurement RFP tracker</p>

        <Notice {...notice} />

        {/* Add task */}
        <form onSubmit={handleAddTask} className="flex gap-2 mb-10">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. Finish janitorial RFP tomorrow"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? '…' : 'Add Task'}
          </button>
        </form>

        {/* Pending */}
        <Section label={`Pending (${pending.length})`}>
          {pending.length === 0
            ? <Empty text="No pending tasks." />
            : pending.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                actionLoading={actionLoading}
                onDone={handleDone}
                onSnooze={handleSnooze}
              />
            ))
          }
        </Section>

        {/* Done */}
        {done.length > 0 && (
          <Section label={`Completed (${done.length})`} faded>
            {done.map(t => (
              <TaskCard key={t.id} task={t} actionLoading={actionLoading} />
            ))}
          </Section>
        )}

      </div>
    </div>
  )
}

function Section({ label, children, faded }) {
  return (
    <div className={`mb-8 ${faded ? 'opacity-60' : ''}`}>
      <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">{label}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function Empty({ text }) {
  return <p className="text-gray-600 text-sm">{text}</p>
}

function TaskCard({ task, actionLoading, onDone, onSnooze }) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue = task.status === 'pending' && task.due_date < today

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${overdue ? 'border-red-800 bg-red-950/30' : 'border-gray-800 bg-gray-900'}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{task.task}</p>
        <p className={`text-xs mt-0.5 ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
          {task.due_date}{overdue ? ' — overdue' : ''}
        </p>
      </div>

      <Badge status={task.status} />

      {task.status === 'pending' && onDone && (
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => onDone(task.id)}
            disabled={!!actionLoading}
            className="text-xs px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 rounded-lg transition-colors"
          >
            {actionLoading === task.id + '_done' ? '…' : 'Done'}
          </button>
          <button
            onClick={() => onSnooze(task.id)}
            disabled={!!actionLoading}
            className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-lg transition-colors"
          >
            {actionLoading === task.id + '_snooze' ? '…' : 'Snooze 2d'}
          </button>
        </div>
      )}
    </div>
  )
}
