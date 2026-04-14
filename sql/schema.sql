-- ============================================
-- AI Task Manager - Supabase Schema
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tasks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL,
  task            TEXT        NOT NULL,
  due_date        DATE        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  reminder_type   TEXT        NOT NULL DEFAULT 'daily',
  last_reminded_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_tasks_user_id  ON tasks (user_id);
CREATE INDEX idx_tasks_due_date ON tasks (due_date);
CREATE INDEX idx_tasks_status   ON tasks (status);

-- Row Level Security (enable but keep open until auth is added)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for now"
  ON tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);
