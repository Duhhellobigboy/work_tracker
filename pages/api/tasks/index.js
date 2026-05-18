import { parseTask } from '../../../lib/ai'
import { getRequestAuth } from '../../../lib/api-auth'
import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') return getTasks(req, res)
  if (req.method === 'POST') return createTask(req, res)
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Method not allowed' })
}

async function cleanupStaleTasks(userId) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 14);
  const cutoffStr = cutoffDate.toISOString();
  const cutoffDateStr = cutoffDate.toISOString().slice(0, 10);

  // Auto-delete unattended tasks after 2 weeks
  await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
    .neq('status', 'done')
    .or(`snoozed_until.is.null,snoozed_until.lte.${new Date().toISOString()}`)
    .or(`created_at.lt.${cutoffStr},due_date.lt.${cutoffDateStr}`);
}

// GET /api/tasks
async function getTasks(req, res) {
  const auth = await getRequestAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const { user } = auth
  
  // Cleanup stale tasks
  await cleanupStaleTasks(user.id);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)

  if (error) return res.status(500).json({ error: error.message })
  
  // Sort tasks
  const urgencyWeight = { severe: 1, urgent: 2, 'non-urgent': 3 }
  data.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    if (a.status === 'done') {
      return new Date(b.completed_at || b.updated_at || b.created_at) - new Date(a.completed_at || a.updated_at || a.created_at);
    }
    const uA = urgencyWeight[a.urgency] || 3;
    const uB = urgencyWeight[b.urgency] || 3;
    if (uA !== uB) return uA - uB;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  return res.status(200).json({ tasks: data })
}

// POST /api/tasks
// Body: { input: string, urgency: string, due_bucket: string }
async function createTask(req, res) {
  const auth = await getRequestAuth(req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })

  const { user } = auth
  const { input, urgency = 'non-urgent', due_bucket = '1_week' } = req.body

  if (!input) {
    return res.status(400).json({ error: 'input is required' })
  }

  // Cleanup before counting
  await cleanupStaleTasks(user.id);

  // Check active limit
  const { count, error: countErr } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'done')

  if (countErr) return res.status(500).json({ error: countErr.message })
  
  if (count >= 20) {
    return res.status(400).json({ error: 'You have reached the maximum of 20 active tasks. Please complete or remove some tasks first.' })
  }

  // 1. AI parsing (resilient to failure)
  const parsed = await parseTask(input)
  
  // Calculate bucket date
  let finalDueDate = parsed.due_date;
  const now = new Date();
  if (due_bucket === '3_days') now.setDate(now.getDate() + 3);
  else if (due_bucket === '1_week') now.setDate(now.getDate() + 7);
  else if (due_bucket === '2_weeks') now.setDate(now.getDate() + 14);
  
  const bucketDate = now.toISOString().slice(0, 10);
  if (new Date(parsed.due_date) < new Date(bucketDate)) {
      finalDueDate = bucketDate;
  }

  // 2. Insert into Supabase for authenticated owner
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: parsed.title,
      due_date: finalDueDate,
      status: 'pending',
      user_id: user.id,
      urgency,
      due_bucket
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json({ task: data })
}
