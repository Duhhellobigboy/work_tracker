-- Migration: Add fields for Tasks V2

-- 1. Rename 'task' to 'title'
ALTER TABLE tasks RENAME COLUMN task TO title;

-- 2. Add new columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'non-urgent' CHECK (urgency IN ('urgent', 'non-urgent', 'severe'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_bucket TEXT DEFAULT '1_week' CHECK (due_bucket IN ('3_days', '1_week', '2_weeks'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;

-- 3. Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
