-- ============================================================
-- RLS fix: server-side API uses service role (bypasses RLS).
-- These policies protect direct client access only.
-- ============================================================

-- Make user_id nullable (no auth yet, API sets it server-side)
ALTER TABLE tasks ALTER COLUMN user_id DROP NOT NULL;

-- Drop the old open policy from initial setup
DROP POLICY IF EXISTS "Allow all for now" ON tasks;

-- Keep RLS enabled — service role key bypasses it automatically.
-- These policies guard any future direct-client access:

CREATE POLICY "select_own" ON tasks
  FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "insert_own" ON tasks
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "update_own" ON tasks
  FOR UPDATE USING (auth.uid()::text = user_id OR user_id IS NULL);
