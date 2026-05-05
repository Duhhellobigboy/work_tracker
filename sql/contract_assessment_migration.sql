-- Run once in Supabase SQL editor (contract project: mjruxupqtefnarxqsiij)
-- Brings the deployed contract_assessments table in line with the simplified schema.
-- Safe to re-run (ADD COLUMN IF NOT EXISTS / DROP COLUMN IF EXISTS).

-- Add analysis columns (n8n upserts here by job_id instead of writing to priority_reports)
ALTER TABLE public.contract_assessments
  ADD COLUMN IF NOT EXISTS summary_text text,
  ADD COLUMN IF NOT EXISTS most_important_document text,
  ADD COLUMN IF NOT EXISTS top_urgent_items jsonb,
  ADD COLUMN IF NOT EXISTS recommended_actions jsonb,
  ADD COLUMN IF NOT EXISTS counts jsonb,
  ADD COLUMN IF NOT EXISTS sheet_url text;

-- Remove columns that are no longer part of the schema
ALTER TABLE public.contract_assessments
  DROP COLUMN IF EXISTS upload_type,
  DROP COLUMN IF EXISTS parsed_row_count,
  DROP COLUMN IF EXISTS source_headers,
  DROP COLUMN IF EXISTS webhook_response,
  DROP COLUMN IF EXISTS latest_priority_report_id;
