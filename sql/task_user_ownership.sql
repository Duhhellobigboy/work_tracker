-- ============================================================
-- Secure task ownership migration
-- ============================================================
-- Run this in Supabase SQL editor after confirming legacy rows
-- can be deleted (rows without valid user ownership).

-- 1) Remove legacy rows without a valid UUID user reference
DELETE FROM tasks
WHERE user_id IS NULL
   OR btrim(user_id::text) = ''
   OR user_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- 2) Convert user_id to UUID if currently text
ALTER TABLE tasks
  ALTER COLUMN user_id TYPE uuid
  USING user_id::uuid;

-- 3) Enforce ownership requirement
ALTER TABLE tasks
  ALTER COLUMN user_id SET NOT NULL;

-- 4) Keep row-level security enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 5) Remove permissive/legacy policies
DROP POLICY IF EXISTS "Allow all for now" ON tasks;
DROP POLICY IF EXISTS "select_own" ON tasks;
DROP POLICY IF EXISTS "insert_own" ON tasks;
DROP POLICY IF EXISTS "update_own" ON tasks;
DROP POLICY IF EXISTS "delete_own" ON tasks;

-- 6) Strict per-user policies
CREATE POLICY "select_own" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON tasks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own" ON tasks
  FOR DELETE USING (auth.uid() = user_id);
