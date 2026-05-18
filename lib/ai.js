import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

/**
 * Parses natural language into { title, due_date }.
 * @param {string} input  e.g. "Finish janitorial RFP tomorrow"
 * @returns {{ title: string, due_date: string }}  due_date in YYYY-MM-DD
 */
export async function parseTask(input) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  // Fallback object in case AI fails
  const fallback = {
    title: input,
    due_date: tomorrowStr
  }

  // If no API key, skip AI entirely
  if (!process.env.CLAUDE_API_KEY) {
    console.warn('CLAUDE_API_KEY missing, skipping AI parsing.')
    return fallback
  }

  try {
    const todayStr = today.toISOString().slice(0, 10)
    const prompt = `You are a task extraction assistant. Today is ${todayStr}.

Extract the task description and due date from the user's input.

Rules:
- Output STRICT JSON only. No explanation, no markdown, no extra text.
- "tomorrow" = today + 1 day
- "next Friday" = the upcoming Friday from today
- "in X days" = today + X days
- "next week" = today + 7 days
- If no date is mentioned, default to tomorrow.
- due_date format must be YYYY-MM-DD

Output format:
{"title": "string", "due_date": "YYYY-MM-DD"}

User input: "${input.replace(/"/g, "'")}"`

    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 128,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].text.trim()
    try {
      return JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[^}]+\}/)
      if (match) return JSON.parse(match[0])
      return fallback
    }
  } catch (err) {
    console.error('Anthropic API error, falling back to local parsing:', err.message)
    return fallback
  }
}
