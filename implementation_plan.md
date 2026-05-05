# Contract Assessment — Implementation Plan

## 1. Overview

Add a self-contained **Contract Assessment** page at `/contract-assessment`. Users can upload a CSV file (optionally tagging it with a project/workspace name), which is sent to an n8n webhook for processing. Results written back to Supabase are then fetched and displayed on the same page: summary text, the most important document, top urgent items, recommended actions, and numeric counts.

The feature lives entirely inside the existing Next.js app, uses the same Supabase clients, the same auth guard, and the same `DashboardLayout` so it looks and feels identical to the Task Manager.

---

## 2. Assumptions

- The app runs on Next.js with the `pages/` router (confirmed).
- Supabase is already configured; a **new table** (`contract_assessments`) will be added to store results.
- n8n is accessible at a URL stored in an environment variable. The webhook accepts a `multipart/form-data` POST with the CSV file and optional metadata.
- n8n is responsible for parsing the CSV, running analysis, and writing results back to the `contract_assessments` Supabase table.
- The front-end polls Supabase for the result after triggering the webhook (no real-time WebSocket needed for MVP).
- CSV files only — no PDF or DOCX support in this phase.
- All authenticated users can use the feature (no new role required).
- The Supabase `contract_assessments` row is keyed by a `job_id` UUID that the front-end generates and passes to n8n, so the polling query is deterministic.

---

## 3. Affected Files / Components

### New files to create

| File | Purpose |
|------|---------|
| `pages/contract-assessment.jsx` | Main page (route `/contract-assessment`) |
| `pages/api/contract/trigger.js` | API route — forwards CSV + metadata to n8n webhook |
| `components/contract/UploadForm.jsx` | CSV upload form with project name input |
| `components/contract/AssessmentResults.jsx` | Renders results from Supabase |
| `components/contract/StatusBanner.jsx` | Uploading / processing / error / success states |
| `sql/contract_assessment_schema.sql` | Supabase table DDL for `contract_assessments` |

### Existing files to edit (minimally)

| File | Change |
|------|--------|
| `components/layout/DashboardLayout.jsx` | Add "Contract Assessment" nav link in header |
| `.env` | Document two new env var keys (values stay in `.env.local`) |

### Files that must NOT be touched

- `pages/_app.js` — auth guard stays as-is
- `pages/login.jsx`, `pages/signup.jsx`, `pages/profile.jsx`
- `pages/index.jsx` (Task Manager)
- `pages/admin/*`
- `lib/supabase.js`, `lib/supabase-browser.js`, `lib/api-auth.js`
- `pages/api/tasks/*`

---

## 4. Route / Page Changes

| Route | File | Layout | Auth required |
|-------|------|--------|--------------|
| `/contract-assessment` | `pages/contract-assessment.jsx` | `DashboardLayout` | Yes (same as `/`) |

The existing `_app.js` auth guard already protects all non-login/signup routes, so no changes needed there.

---

## 5. UI Components Needed

### `UploadForm.jsx`
- Optional text input: "Project / Workspace name"
- File input accepting `.csv` only (drag-and-drop optional, plain `<input type="file">` for MVP)
- "Analyse Contracts" submit button (disabled while processing)
- Calls the parent page's `handleSubmit` handler

### `StatusBanner.jsx`
- Four visual states, consistent with existing Tailwind dark-theme palette:
  - **idle** — nothing shown
  - **uploading** — spinner + "Uploading file…"
  - **processing** — spinner + "Processing… this may take a moment"
  - **error** — red alert with error message
  - **done** — green confirmation, auto-hides after results load

### `AssessmentResults.jsx`
Props: `result` object from Supabase.  
Renders (when data is present):
- **Summary** — `result.summary_text` in a card
- **Most Important Document** — `result.most_important_document` highlighted card
- **Top Urgent Items** — `result.top_urgent_items` (array → bulleted list)
- **Recommended Actions** — `result.recommended_actions` (array → numbered list)
- **Counts** — inline badges: e.g. "12 documents · 4 urgent · 3 actions" from `result.counts` object
- Gracefully skips any section where the field is null/undefined

---

## 6. Data Flow: Upload → n8n → Supabase → Display

```
Browser
  │
  ├─ User selects CSV + optional project name
  │
  ├─ Front-end generates a UUIDv4 job_id
  │
  └─ POST /api/contract/trigger
         │  (Authorization: Bearer <token>)
         │  (multipart/form-data: file, job_id, project_name, user_id)
         │
         ▼
     pages/api/contract/trigger.js
         │
         ├─ Validates auth via getRequestAuth()
         │
         ├─ Reads file buffer from multipart body
         │
         └─ POST to N8N_CONTRACT_WEBHOOK_URL
                │  (multipart/form-data forwarded, plus job_id + user_id)
                │  (Header: x-api-key: N8N_CONTRACT_WEBHOOK_SECRET)
                │
                ▼
            n8n Workflow
                │
                ├─ Parses CSV
                ├─ Runs analysis
                └─ INSERT into Supabase contract_assessments
                       (job_id, user_id, project_name, summary_text,
                        most_important_document, top_urgent_items,
                        recommended_actions, counts, status='done')

Browser (polling loop, every 3 s, max 40 tries = 2 min)
  │
  └─ GET /api/contract/trigger?job_id=<uuid>   [or direct Supabase query]
         │
         └─ SELECT * FROM contract_assessments WHERE job_id = ? AND user_id = ?
                │
                └─ Returns row when status = 'done'
                       │
                       └─ AssessmentResults renders the data
```

**Why poll instead of real-time subscription?** The existing app has no real-time patterns. Polling every 3 s for up to 2 minutes is simple, predictable, and requires no new infrastructure.

---

## 7. Environment Variables Required

Add to `.env` (template) and `.env.local` (real values):

```bash
# n8n Contract Assessment webhook
N8N_CONTRACT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/contract-assessment
N8N_CONTRACT_WEBHOOK_SECRET=your_shared_secret_here
```

`N8N_WEBHOOK_URL` and `N8N_API_KEY` already exist in `.env` for other workflows — the contract assessment gets its **own** dedicated keys so they can be rotated independently.

Both are **server-only** (no `NEXT_PUBLIC_` prefix) — never exposed to the browser.

---

## 8. Step-by-Step Implementation Phases

### Phase 0 — Database (do first, independent of code)
1. Run `sql/contract_assessment_schema.sql` in Supabase SQL editor.
   - Creates `contract_assessments` table with RLS: users see only their own rows.
   - Columns: `id`, `job_id` (unique), `user_id`, `project_name`, `status`, `summary_text`, `most_important_document`, `top_urgent_items` (jsonb), `recommended_actions` (jsonb), `counts` (jsonb), `created_at`, `updated_at`.

### Phase 1 — API Route
2. Create `pages/api/contract/trigger.js`.
   - Handle `POST`: validate auth, parse multipart body (use `formidable` or `busboy` — check if already in dependencies, otherwise add `formidable`), forward to n8n.
   - Handle `GET ?job_id=`: validate auth, query Supabase for the row, return it.
   - Return `202 Accepted` on successful webhook trigger.

### Phase 2 — UI Components
3. Create `components/contract/StatusBanner.jsx`.
4. Create `components/contract/UploadForm.jsx`.
5. Create `components/contract/AssessmentResults.jsx`.

### Phase 3 — Page
6. Create `pages/contract-assessment.jsx`.
   - Import `DashboardLayout`, `UploadForm`, `StatusBanner`, `AssessmentResults`.
   - State: `status` (`idle | uploading | processing | error | done`), `jobId`, `result`, `errorMsg`.
   - `handleSubmit`: generate UUID, set status=uploading, POST to `/api/contract/trigger`, on 202 set status=processing and start polling.
   - Polling: `setInterval` every 3 s, GET `/api/contract/trigger?job_id=...`, stop when `status === 'done'` or after 40 tries.
   - Render layout with all three sub-components.

### Phase 4 — Navigation
7. Edit `components/layout/DashboardLayout.jsx` — add a "Contract Assessment" link in the header nav, styled identically to any existing nav items (or as a plain link if there are none yet, matching the "Task Manager" text style).

### Phase 5 — Environment
8. Add the two new keys to `.env` (template comments only) and `.env.local` (real values).

### Phase 6 — SQL file
9. Write `sql/contract_assessment_schema.sql` with `CREATE TABLE`, indexes, and RLS policies.

---

## 9. Testing Checklist

### Functional
- [ ] Page is reachable at `/contract-assessment` when logged in
- [ ] Page redirects to `/signup` when not logged in (inherited from `_app.js`)
- [ ] File input only accepts `.csv`
- [ ] Submit with no file shows validation message, does not call API
- [ ] Submit with valid CSV triggers POST to `/api/contract/trigger`
- [ ] API route rejects unauthenticated requests (401)
- [ ] API route rejects non-CSV file types (400)
- [ ] `StatusBanner` shows "uploading" then "processing" states
- [ ] Polling stops when result row appears in Supabase
- [ ] `AssessmentResults` renders all fields when present
- [ ] `AssessmentResults` skips sections gracefully when fields are null
- [ ] Polling timeout (2 min) shows a friendly error
- [ ] n8n webhook receives correct `job_id`, `user_id`, and file

### Non-regression
- [ ] Task Manager (`/`) still works — add/done/snooze tasks
- [ ] Login / signup / logout flows unchanged
- [ ] Profile page saves correctly
- [ ] Admin pages load without errors
- [ ] No console errors on `/contract-assessment` page load

### Environment
- [ ] App starts without the two new env vars (they should only be required at webhook trigger time, with a clear error message if missing)
- [ ] Missing `N8N_CONTRACT_WEBHOOK_URL` returns a 500 with a helpful message, not a crash

---

## 10. Risks / Things Not to Break

| Risk | Mitigation |
|------|-----------|
| Editing `DashboardLayout.jsx` breaks the Task Manager header | Add nav link in an isolated section; no changes to existing structure |
| `formidable` / multipart parsing not in deps | Check `package.json` first; if absent, add `formidable@^3` (actively maintained) |
| Polling leaks on unmount (React strict mode double-mount) | Store interval ID in a ref, clear in `useEffect` cleanup |
| n8n webhook URL accidentally logged | Never log the full URL or secret in API routes |
| RLS misconfiguration exposes other users' results | Write RLS policy that enforces `user_id = auth.uid()` on SELECT; test with two accounts |
| Large CSV files rejected by Next.js body size limit | Set `api.bodyParser: false` in the API route config and let `formidable` handle streaming |
| Job ID collision | Use `crypto.randomUUID()` (built into Node 19+ / modern browsers); add UNIQUE constraint in DB |
| User submits twice rapidly | Disable submit button while `status !== 'idle'`; re-enable after done/error |
| Webhook processes slowly (> 2 min) | Polling timeout shows a "still processing" message with a "Check again" manual button rather than a hard error |
