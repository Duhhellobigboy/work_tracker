# Contract Assessment Temporary Removal Plan

## Goal

Hide the `Contract Assessment` feature completely from the UI and routes without deleting feature code, so it can be restored later.

---

## 1) Full Feature Surface (What must be disabled)

### UI + Navigation

- `components/layout/DashboardLayout.jsx`
  - Adds nav link to `/contract-assessment` with label `Contract Assessment`

### Page Route

- `pages/contract-assessment.jsx`
  - Next.js page route at `/contract-assessment`
  - Imports and renders:
    - `components/contract/UploadForm.jsx`
    - `components/contract/StatusBanner.jsx`
    - `components/contract/AssessmentResults.jsx`
  - Uses:
    - `lib/contract/normalizeAssessment.js`
    - `lib/supabase-contract-browser.js`
  - Calls API route:
    - `POST /api/contract/trigger`
    - `GET /api/contract/trigger?latest=1`
    - `GET /api/contract/trigger?job_id=...`

### API Route

- `pages/api/contract/trigger.js`
  - Route path: `/api/contract/trigger`
  - Imports and depends on:
    - `lib/api-auth.js`
    - `lib/contract/normalizeAssessment.js`
    - `lib/contract/n8nWebhook.js`
    - `lib/supabase-contract-server.js`
    - `formidable`

### Feature-Only Components (keep files, do not delete)

- `components/contract/UploadForm.jsx`
- `components/contract/StatusBanner.jsx`
- `components/contract/AssessmentResults.jsx`

### Feature-Only Supporting Libs (keep files, do not delete)

- `lib/contract/n8nWebhook.js`
- `lib/contract/normalizeAssessment.js`
- `lib/supabase-contract-browser.js`
- `lib/supabase-contract-server.js`

### SQL / Docs (no runtime impact; keep files)

- `sql/contract_assessment_schema.sql`
- `sql/contract_assessment_migration.sql`
- `sql/contract_assessment_add_user_id.sql`
- `implementation_plan.md`

---

## 2) Safe Disable Strategy

Use a route guard + nav removal approach:

1. Remove feature entry point from navigation.
2. Keep page file present, but force it to return `404` via `getServerSideProps`.
3. Keep API route present, but return `404` for all methods.
4. Add clear top-of-file marker comments in affected runtime files.
5. Do **not** delete feature components/libs.

This makes the feature invisible and inaccessible while preserving all code for restoration.

---

## 3) Exact Edits to Apply

## A) `components/layout/DashboardLayout.jsx`

At top of file, add:

```js
// Temporarily disabled feature Contract Assessment safe to restore later
```

Then disable/remove the nav link block:

- Remove or comment the `<Link href="/contract-assessment">Contract Assessment</Link>` section.
- Keep `Task Manager` link and `ProfileDropdown` untouched.

Optional reversible pattern:

```js
const ENABLE_CONTRACT_ASSESSMENT = false
```

and conditionally render the link only when enabled.

## B) `pages/contract-assessment.jsx`

At top of file, add:

```js
// Temporarily disabled feature Contract Assessment safe to restore later
```

Then disable rendering and route access by adding:

```js
export async function getServerSideProps() {
  return { notFound: true }
}
```

Recommended cleanup inside this file while disabled:

- Remove or comment unused imports if page component is kept.
- Keep all existing feature logic in place if you prefer fast restore.

Simple reversible option:

```js
const ENABLE_CONTRACT_ASSESSMENT = false
```

and:

- if disabled, export `getServerSideProps` returning `notFound: true`.
- if enabled later, restore normal page behavior.

## C) `pages/api/contract/trigger.js`

At top of file, add:

```js
// Temporarily disabled feature Contract Assessment safe to restore later
```

Disable endpoint without deleting implementation:

```js
export default async function handler(req, res) {
  return res.status(404).json({ error: 'Not found' })
}
```

Then keep old implementation in file but commented, or move old handler body below with a marker:

```js
/*
  Contract Assessment original handler retained for later restore.
*/
```

This prevents any background invocation or accidental external calls.

---

## 4) Verification Steps (Must pass)

Run:

```bash
npm run build
```

Then:

```bash
npm run dev
```

Verify manually:

1. Header/nav no longer shows `Contract Assessment`.
2. Visiting `/contract-assessment` returns 404.
3. `POST`/`GET` to `/api/contract/trigger` returns 404.
4. Main task manager flows still function.
5. No new compile or runtime errors in console.

---

## 5) Restore Procedure (Later)

To restore:

1. Re-enable nav link in `components/layout/DashboardLayout.jsx`.
2. Remove `notFound` guard from `pages/contract-assessment.jsx`.
3. Restore original handler logic in `pages/api/contract/trigger.js`.
4. If using flags, set:

```js
const ENABLE_CONTRACT_ASSESSMENT = true
```

5. Re-run `npm run build` and `npm run dev`.

---

## 6) Scope Guardrails

- Do not refactor unrelated files.
- Do not delete any `components/contract/*`, `lib/contract/*`, SQL, or docs.
- Keep modifications limited to:
  - `components/layout/DashboardLayout.jsx`
  - `pages/contract-assessment.jsx`
  - `pages/api/contract/trigger.js`

