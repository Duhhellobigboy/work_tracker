You are a senior full-stack engineer and system architect.

I am building an AI-powered task manager for a real user (procurement manager handling RFPs), and I need you to generate a clean, production-ready implementation plan and code where appropriate.

IMPORTANT CONSTRAINTS:

* n8n will be used as the backend orchestration layer (NOT you)
* Supabase is the database (source of truth)
* Telegram is the main interface for notifications
* You (Claude) are ONLY responsible for:

  * designing the data model
  * defining API contracts
  * generating prompts for AI parsing
  * generating frontend UI (React or simple web app)
* Do NOT attempt to replace n8n or simulate workflows internally

---

## SYSTEM OVERVIEW

We are building:

Voice/Text Input → n8n webhook → AI parsing → Supabase → daily reminders → Telegram

The UI will later call the n8n webhook.

---

## YOUR TASKS

### 1. DATABASE SCHEMA (Supabase)

Design a production-ready PostgreSQL schema for tasks.

Requirements:

* Each task has:

  * id (uuid)
  * user_id (string, Telegram ID)
  * task (text)
  * due_date (date)
  * status (pending, done)
  * reminder_type (default: daily)
  * last_reminded_at (timestamp)
  * created_at (timestamp)
* Include SQL create table statement
* Add indexes for performance

---

### 2. AI PARSING PROMPT

Generate a robust prompt for extracting structured data from natural language input.

Input examples:

* "Finish janitorial RFP tomorrow"
* "Follow up with vendor next Friday"
* "Review contract in 2 days"

Output format MUST be strict JSON:
{
"task": "...",
"due_date": "YYYY-MM-DD"
}

Requirements:

* Handle relative dates (tomorrow, next Friday, in 2 days)
* Assume tomorrow if no date is provided
* No extra text, JSON only

---

### 3. WEBHOOK API CONTRACT

Define clean API payloads for the n8n webhook.

Include:

A) Create Task:
{
"type": "create_task",
"user_id": "...",
"input": "natural language task"
}

B) Command Actions:
{
"type": "command",
"task_id": "...",
"action": "done"
}

{
"type": "command",
"task_id": "...",
"action": "snooze",
"days": 2
}

Make this clean and extensible.

---

### 4. FRONTEND UI (React)

Generate a simple, clean frontend (can be minimal React or Next.js) with:

Pages:

1. Dashboard:

   * List all tasks
   * Show task, due date, status

2. Add Task:

   * Input field (text)
   * Submit button

3. Task Actions:

   * Mark as done
   * Snooze (2 days button)

Requirements:

* Use fetch() to call webhook
* Do NOT include authentication for now
* Clean, minimal UI
* Tailwind styling preferred

---

### 5. ARCHITECTURE NOTES

Explain:

* how UI connects to n8n webhook
* how n8n connects to Supabase
* where AI parsing fits

Keep it concise and practical.

---

### 6. OPTIONAL (IF EASY)

* Suggest how to extend this later with:

  * Telegram inline buttons
  * Voice input from web

---

## OUTPUT FORMAT

Structure your response as:

1. Database Schema (SQL)
2. AI Prompt
3. API Contracts
4. Frontend Code
5. Architecture Explanation
6. Future Improvements

---

IMPORTANT:

* Be precise and production-minded
* Do NOT overengineer
* Do NOT include unrelated features
* Keep everything aligned with n8n as the backend orchestrator

This is a real product, not a demo.