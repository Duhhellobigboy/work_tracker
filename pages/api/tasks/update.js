import { getRequestAuth } from '../../../lib/api-auth'
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { task_id, action, days } = req.body
  const auth = await getRequestAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })
  const { user } = auth

  if (!task_id || !action) {
    return res.status(400).json({ error: 'task_id and action are required' })
  }

  if (action === 'done') {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: 'done' })
      .eq('id', task_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return res.status(404).json({ error: 'Task not found' })
    return res.status(200).json({ task: data })
  }

  if (action === 'snooze') {
    const snoozeBy = days ?? 2

    // Fetch current due_date first
    const { data: existing, error: fetchErr } = await supabase
      .from('tasks')
      .select('due_date')
      .eq('id', task_id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr) return res.status(404).json({ error: 'Task not found' })

    const newDate = new Date(existing.due_date)
    newDate.setDate(newDate.getDate() + snoozeBy)
    const due_date = newDate.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('tasks')
      .update({ due_date })
      .eq('id', task_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return res.status(404).json({ error: 'Task not found' })
    return res.status(200).json({ task: data })
  }

  return res.status(400).json({ error: `Unknown action: ${action}` })
}
