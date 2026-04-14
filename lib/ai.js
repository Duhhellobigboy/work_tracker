import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

/**
 * Parses natural language into { task, due_date }.
 * @param {string} input  e.g. "Finish janitorial RFP tomorrow"
 * @returns {{ task: string, due_date: string }}  due_date in YYYY-MM-DD
 */
export async function parseTask(input) {
  const today = new Date().toISOString().slice(0, 10)

  const prompt = `You are a task extraction assistant. Today is ${today}.

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
{"task": "string", "due_date": "YYYY-MM-DD"}

User input: "${input.replace(/"/g, "'")}"`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 128,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].text.trim()

  try {
    return JSON.parse(raw)
  } catch {
    // Fallback: extract JSON from the response in case there's stray text
    const match = raw.match(/\{[^}]+\}/)
    if (match) return JSON.parse(match[0])
    throw new Error(`AI returned unparseable response: ${raw}`)
  }
}
