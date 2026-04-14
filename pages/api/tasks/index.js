import { parseTask } from '../../../lib/ai'
import { getRequestAuth } from '../../../lib/api-auth'
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') return getTasks(req, res)
  if (req.method === 'POST') return createTask(req, res)
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

// GET /api/tasks
async function getTasks(req, res) {
  const auth = await getRequestAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const { user } = auth
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ tasks: data })
}

// POST /api/tasks
// Body: { input: string }
async function createTask(req, res) {
  const auth = await getRequestAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const { user } = auth
  const { input } = req.body

  if (!input) {
    return res.status(400).json({ error: 'input is required' })
  }

  // 1. AI parsing
  let parsed
  try {
    parsed = await parseTask(input)
  } catch (e) {
    return res.status(422).json({ error: `AI parsing failed: ${e.message}` })
  }

  // 2. Insert into Supabase for authenticated owner
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      task: parsed.task,
      due_date: parsed.due_date,
      status: 'pending',
      user_id: user.id,
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json({ task: data })
}
