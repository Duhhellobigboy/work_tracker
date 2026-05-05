-- Run once on existing databases where `contract_assessments` predates `user_id`.
-- Safe to re-run (IF NOT EXISTS).

alter table public.contract_assessments
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_contract_assessments_user_id
  on public.contract_assessments (user_id);
