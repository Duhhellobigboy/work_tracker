# Webhook API Contract

## Endpoint
POST {N8N_WEBHOOK_URL}
Content-Type: application/json

---

## A) Create Task

```json
{
  "type": "create_task",
  "user_id": "5890813158",
  "input": "Finish janitorial RFP tomorrow"
}
```

n8n flow:
1. Receive payload
2. Send `input` to OpenAI with AI parsing prompt
3. Get back `{ "task": "...", "due_date": "YYYY-MM-DD" }`
4. Insert row into Supabase `tasks` table with user_id + parsed fields
5. Confirm via Telegram

---

## B) Mark Done

```json
{
  "type": "command",
  "task_id": "uuid-here",
  "action": "done"
}
```

n8n flow:
1. Update `tasks` SET status = 'done' WHERE id = task_id

---

## C) Snooze

```json
{
  "type": "command",
  "task_id": "uuid-here",
  "action": "snooze",
  "days": 2
}
```

n8n flow:
1. Update `tasks` SET due_date = due_date + INTERVAL 'X days' WHERE id = task_id

---

## D) Fetch Tasks (GET-style via POST)

```json
{
  "type": "get_tasks",
  "user_id": "5890813158"
}
```

n8n returns:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "task": "Finish janitorial RFP",
      "due_date": "2026-04-13",
      "status": "pending"
    }
  ]
}
```
