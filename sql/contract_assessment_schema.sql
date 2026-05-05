-- Contract Assessment — single source of truth for uploads and AI-generated results.
-- Written to by n8n (service role); users read via RLS.
-- For existing deployments run sql/contract_assessment_migration.sql instead.

CREATE TABLE IF NOT EXISTS public.contract_assessments (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                  text          NOT NULL UNIQUE,
  user_id                 uuid          REFERENCES auth.users (id) ON DELETE SET NULL,
  project_name            text,
  original_filename       text,
  row_count               int,
  status                  text          NOT NULL DEFAULT 'pending',
  summary_text            text,
  most_important_document text,
  top_urgent_items        jsonb,
  recommended_actions     jsonb,
  counts                  jsonb,
  error_message           text,
  sheet_url               text,
  created_at              timestamptz   NOT NULL DEFAULT now(),
  updated_at              timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_assessments_user_id
  ON public.contract_assessments (user_id);

CREATE INDEX IF NOT EXISTS idx_contract_assessments_job_id
  ON public.contract_assessments (job_id);

CREATE INDEX IF NOT EXISTS idx_contract_assessments_created_at
  ON public.contract_assessments (user_id, created_at DESC);

ALTER TABLE public.contract_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_assessments_select_own"
  ON public.contract_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Inserts/updates are done by service role / n8n (bypass RLS). No user INSERT policy needed.
