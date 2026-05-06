# Copilot Intelligence Panel — Implementation Plan

> A structured, frontend-driven workflow engine that orchestrates Microsoft Copilot through deterministic, multi-step contract analysis — without using any external AI APIs or backend AI processing.

---

## 1. Executive Summary

The **Copilot Intelligence Panel** is a new module added to the existing Work Tracker application at the route `/copilot-tools`. It is **not** an AI tool in itself: it is a **prompt orchestration system** that compensates for Microsoft Copilot's well-known limitations (RAG truncation, summarization bias, context drift on long contracts) by guiding the user through a deterministic workflow:

```
INIT  →  CONTINUE (loop)  →  STRUCTURED OUTPUT
```

The user pastes contract text or notes into the panel, fills in lightweight context (project, vendors, focus), and the panel generates ready-to-paste prompts that force Copilot into exhaustive, section-by-section analysis. The user copies prompts into Copilot, runs them in their secure enterprise tenant, and optionally pastes the results back into the panel for capture.

**Why this exists:** Copilot, when handed a long contract, defaults to a 3–5 bullet summary and silently skips clauses. Users on regulated infrastructure procurement projects (Hyundai, ABB, GE, etc.) need *every* obligation, *every* deliverable, and a Day 0–30 sequencing plan — not a tidy summary. This panel forces structure.

**What this is NOT:**
- Not an AI gateway, not a wrapper around the Anthropic/OpenAI/Copilot APIs.
- Not a backend service. All logic runs in the browser.
- Not a free-form chat. Every interaction is a templated, versioned prompt.

---

## 2. Architecture Overview

### 2.1 Stack alignment

The existing Work Tracker app uses:

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (pages router) |
| UI | React 18 + Tailwind CSS |
| Auth/DB | Supabase |
| Observability | Sentry |
| Language | Mostly `.jsx` / `.js`, with `.ts` for instrumentation |

The Copilot Panel will be added under the existing `pages/` and `components/` directories, following established conventions. The single new TypeScript component (`CopilotPanel.tsx`) is acceptable because the project already supports TS via `instrumentation.ts` and `sentry.client.config.ts`.

### 2.2 High-level diagram

```
┌──────────────────────────────────────────────────────────────┐
│  /copilot-tools  (Next.js page)                              │
│                                                              │
│   ┌────────────────────────────────────────────────────────┐ │
│   │  <CopilotPanel />                                      │ │
│   │   ─ state: input, context, step, lastPrompt, output    │ │
│   │                                                        │ │
│   │   ┌───────────────┐   ┌────────────────────────────┐   │ │
│   │   │ Input section │   │ Context Builder            │   │ │
│   │   └───────────────┘   │  project / vendors / focus │   │ │
│   │                       └────────────────────────────┘   │ │
│   │                                                        │ │
│   │   ┌────────────────────────────────────────────────┐   │ │
│   │   │ Workflow Engine                                │   │ │
│   │   │  [INIT] → [CONTINUE × N] → [OUTPUT × 3]        │   │ │
│   │   └────────────────────────────────────────────────┘   │ │
│   │                       │                                │ │
│   │                       ▼                                │ │
│   │   ┌────────────────────────────────────────────────┐   │ │
│   │   │  promptBuilder.ts (pure functions)             │   │ │
│   │   │   buildInitPrompt(ctx, text)                   │   │ │
│   │   │   buildContinuePrompt(ctx)                     │   │ │
│   │   │   buildObligationsPrompt(ctx)                  │   │ │
│   │   │   buildDeliverablesPrompt(ctx)                 │   │ │
│   │   │   buildGanttPrompt(ctx)                        │   │ │
│   │   │   buildDailyBriefPrompt(ctx, text)             │   │ │
│   │   │   buildVendorIntelPrompt(ctx, text)            │   │ │
│   │   └────────────────────────────────────────────────┘   │ │
│   │                       │                                │ │
│   │                       ▼                                │ │
│   │              copyToClipboard(promptString)             │ │
│   │                       │                                │ │
│   │                       ▼                                │ │
│   │       User pastes → Copilot → results back            │ │
│   │                       │                                │ │
│   │                       ▼                                │ │
│   │   ┌────────────────────────────────────────────────┐   │ │
│   │   │ Optional Output Capture textarea               │   │ │
│   │   └────────────────────────────────────────────────┘   │ │
│   └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Data flow

1. User pastes contract text into the input area.
2. User fills context fields (project, vendors, focus).
3. User clicks a workflow button → `promptBuilder` produces a prompt string → string is copied to clipboard via `navigator.clipboard.writeText`.
4. User pastes into Copilot in their browser/Teams → Copilot processes inside the secure tenant.
5. (Optional) User pastes Copilot's response back into the output textarea, where it can later be saved to Supabase.

**No data leaves the browser unless the user explicitly enables the optional Supabase save.**

---

## 3. File Structure

New files to add (paths relative to project root):

```
work tracker/
├── pages/
│   └── copilot-tools.jsx                    ← new route
├── components/
│   └── copilot/
│       ├── CopilotPanel.tsx                 ← main component
│       ├── InputSection.tsx                 ← textarea + paste helpers
│       ├── ContextBuilder.tsx               ← project / vendors / focus inputs
│       ├── WorkflowEngine.tsx               ← INIT / CONTINUE / OUTPUT buttons
│       ├── AdditionalTools.tsx              ← Daily Brief + Vendor Intel
│       ├── InstructionsPanel.tsx            ← static "how to use" steps
│       ├── OutputCapture.tsx                ← optional response textarea
│       └── types.ts                         ← shared TS types
├── lib/
│   └── copilot/
│       ├── promptBuilder.ts                 ← all prompt templates (pure)
│       ├── prompts/
│       │   ├── init.ts
│       │   ├── continueScan.ts
│       │   ├── obligationsRegister.ts
│       │   ├── deliverableRegister.ts
│       │   ├── ganttChart.ts
│       │   ├── dailyBrief.ts
│       │   └── vendorIntelligence.ts
│       ├── clipboard.ts                     ← clipboard utility
│       └── sessionStore.ts                  ← (optional) Supabase persistence
└── sql/
    └── copilot_sessions.sql                 ← (optional) schema for saved sessions
```

Existing files touched:

```
components/layout/<nav>.jsx                  ← add link to /copilot-tools
components/<task-card>.jsx (or equivalent)   ← add "Analyze with Copilot" button
```

---

## 4. UI Specification

### 4.1 Page layout (`/copilot-tools`)

```
┌─────────────────────────────────────────────────────────────┐
│  Copilot Assistant                                          │  ← Header
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────┐  ┌─────────────────────┐  │
│  │ Paste emails, notes, or      │  │ Context             │  │
│  │ contract text                │  │  Project: [_____]   │  │
│  │                              │  │  Vendors: [_____]   │  │
│  │ [large textarea]             │  │  Focus:   [Risk ▼]  │  │
│  │                              │  └─────────────────────┘  │
│  │                              │                           │
│  └──────────────────────────────┘  ┌─────────────────────┐  │
│                                    │ Instructions        │  │
│  ┌──────────────────────────────┐  │  1. Click button    │  │
│  │ Workflow                     │  │  2. Paste in Copilot│  │
│  │  [Initialize Analysis]       │  │  3. Run             │  │
│  │  [Continue Scan]             │  │  4. Type CONTINUE   │  │
│  │  ─────                       │  │  5. (Optional) paste│  │
│  │  Outputs:                    │  │      results back   │  │
│  │  [Obligations Register]      │  └─────────────────────┘  │
│  │  [Deliverable Register]      │                           │
│  │  [Gantt Day 0–30]            │                           │
│  │  ─────                       │                           │
│  │  Tools:                      │                           │
│  │  [Daily Brief]               │                           │
│  │  [Vendor Intelligence]       │                           │
│  └──────────────────────────────┘                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Paste Copilot output here (optional)                │    │
│  │ [textarea]                                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Visual rules

- **Two-column** layout on desktop (`md:grid-cols-3`, with input spanning 2 columns and context/instructions in a sidebar).
- **Single-column** stack on mobile.
- Tailwind utilities only — no MUI, Radix, shadcn, etc.
- Buttons follow existing app convention; suggest `bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-700` for primary, `border border-slate-300` for secondary.
- Step labels (INIT / CONTINUE / OUTPUT) shown as small uppercase pill badges so the workflow progression reads like a guided system, not a button grid.

### 4.3 Workflow state visualization

The current workflow step is reflected in the UI:

| State | Visual treatment |
|---|---|
| `idle` (no input) | All workflow buttons disabled, gray |
| `ready` (input filled) | INIT button highlighted, CONTINUE/OUTPUT disabled |
| `analyzing` (INIT clicked) | CONTINUE highlighted, OUTPUT enabled but secondary |
| `extracting` (after one or more CONTINUE) | OUTPUT buttons highlighted |

This makes the workflow **feel guided** — the user is always nudged toward the next correct step.

---

## 5. Component Breakdown

### 5.1 `CopilotPanel.tsx` (root)

Responsibilities:
- Owns all top-level state.
- Composes the child components.
- Wires button callbacks to `promptBuilder` + `clipboard`.

State shape:

```ts
type Focus = 'Risk' | 'Delivery' | 'Schedule';

type Context = {
  projectName: string;
  vendors: string[];      // parsed from comma-separated input
  focus: Focus;
};

type WorkflowState = 'idle' | 'ready' | 'analyzing' | 'extracting';

type PanelState = {
  inputText: string;
  context: Context;
  workflow: WorkflowState;
  lastPromptLabel: string | null;   // shown in toast: "Copied: Init Prompt"
  outputText: string;               // optional capture
};
```

### 5.2 `InputSection.tsx`

- Single `<textarea>` (~12 rows, monospaced font for contract readability).
- Placeholder: *"Paste emails, notes, or contract text"*.
- Character count badge in the corner.
- Controlled component — value/onChange flow up to `CopilotPanel`.

### 5.3 `ContextBuilder.tsx`

- `Project Name`: free text input.
- `Vendors`: comma-separated input (e.g. *"Hyundai, ABB, GE"*) — parsed into `string[]` on blur.
- `Focus`: select with options `Risk | Delivery | Schedule`.
- Vendor chips render below the input as a visual confirmation that parsing worked.

### 5.4 `WorkflowEngine.tsx`

The core. Renders three button groups, each with a step badge:

- **STEP 1 — INIT**: `Initialize Contract Analysis`
- **STEP 2 — CONTINUE**: `Continue Scan` (always enabled after INIT, can be clicked many times)
- **STEP 3 — OUTPUT**: three buttons:
  - `Generate Full_Supplier_Obligations_Register`
  - `Generate Exhaustive_Deliverable_Register`
  - `Generate Gantt Chart (Day 0–30)`

Each button calls the matching `promptBuilder` function, then `copyToClipboard`, then updates `workflow` state, then shows a toast (*"Copied — paste into Copilot"*).

### 5.5 `AdditionalTools.tsx`

Two more buttons, visually separated from the main workflow:

- `Daily Brief`
- `Vendor Intelligence`

These are independent tools — they don't require the INIT → CONTINUE flow.

### 5.6 `InstructionsPanel.tsx`

Pure-presentational. Static numbered list:

1. Click button
2. Paste into Copilot
3. Run
4. Type CONTINUE repeatedly if needed
5. Paste results back (optional)

### 5.7 `OutputCapture.tsx`

- Single textarea for the user to paste Copilot's response.
- "Save Session" button (only visible if Supabase persistence flag enabled — see §11).

---

## 6. Prompt System (Critical)

All prompt templates live in `lib/copilot/prompts/*.ts` as **pure functions** that take a `Context` (and optionally the input text) and return a string. This makes them trivially unit-testable and swappable when you version them later.

### 6.1 Shared prompt header

Every prompt starts with the same context preamble so Copilot has a consistent frame:

```ts
export function buildHeader(ctx: Context): string {
  return [
    `Project: ${ctx.projectName || 'N/A'}`,
    `Vendors of interest: ${ctx.vendors.join(', ') || 'N/A'}`,
    `Analysis focus: ${ctx.focus}`,
    '',
  ].join('\n');
}
```

### 6.2 INIT prompt — `prompts/init.ts`

Goal: force exhaustive, section-by-section coverage and *defeat* the summarization default.

```ts
export function buildInitPrompt(ctx: Context, contractText: string): string {
  return `${buildHeader(ctx)}
You are performing an EXHAUSTIVE contract analysis. You will analyze the document below in MULTIPLE PASSES.

RULES — these override your defaults:
1. DO NOT summarize. Summaries are forbidden.
2. DO NOT skip any sections, clauses, schedules, exhibits, or annexes.
3. DO NOT collapse multiple obligations into a single bullet.
4. Process the document SECTION BY SECTION in the order it appears.
5. If a section is long, process the first portion and STOP. I will type CONTINUE.

STEP 1 — Produce a Coverage Checklist BEFORE any analysis:
  - List every section, clause heading, schedule, exhibit, and annex.
  - Number them sequentially (1, 2, 3 ...).
  - Mark each as [ ] PENDING.
  - This checklist is the ground truth for completeness.

STEP 2 — Begin processing from item 1.
  For each clause, output:
    - Clause ID and title
    - Plain-language restatement (no shortening)
    - Obligations (who must do what, by when)
    - Deliverables referenced
    - Risks / ambiguities
    - Cross-references to other clauses
  Then mark the checklist item [x] DONE and move to the next.

STEP 3 — When you reach the end of your response capacity, STOP mid-checklist
  and tell me exactly which item number to resume from.
  I will type CONTINUE to resume.

CONTRACT TEXT:
"""
${contractText}
"""

Begin with the Coverage Checklist now.`;
}
```

### 6.3 CONTINUE prompt — `prompts/continueScan.ts`

Used repeatedly. Forces Copilot to keep going through the checklist without re-summarizing what it already covered.

```ts
export function buildContinuePrompt(ctx: Context): string {
  return `CONTINUE.

Resume from the next [ ] PENDING item in your Coverage Checklist.

RULES:
- DO NOT re-summarize what you already covered.
- DO NOT produce a recap.
- DO NOT shorten remaining clauses.
- Continue the same section-by-section format from the previous turn.
- After each item, mark it [x] DONE in the checklist.
- If you reach response limits again, STOP and state the next item number to resume from.

Project: ${ctx.projectName || 'N/A'}
Focus: ${ctx.focus}

Continue now.`;
}
```

### 6.4 Output prompts

#### a) `prompts/obligationsRegister.ts` — Full_Supplier_Obligations_Register

```ts
export function buildObligationsPrompt(ctx: Context): string {
  return `${buildHeader(ctx)}
Using your full prior analysis (all CONTINUE passes), produce:

Full_Supplier_Obligations_Register

Output a Markdown table with these columns:
| # | Clause Ref | Obligation | Responsible Party | Counterparty | Deadline / Trigger | Dependencies | Penalty / Consequence | Risk Level (L/M/H) |

RULES:
- One row per obligation. Do not bundle multiple obligations into one row.
- Include EVERY obligation that falls on the supplier, including implicit ones (warranties, notice requirements, indemnities, audit rights).
- "Deadline / Trigger" must be specific (e.g. "30 days after Effective Date", "Upon delivery of milestone M2").
- "Dependencies" lists other clauses or obligations that must be satisfied first.
- If a field is unknown, write "TBD — see [clause ref]" rather than guessing.
- Number rows sequentially.
- After the table, list any obligations you were UNABLE to extract and why.`;
}
```

#### b) `prompts/deliverableRegister.ts` — Exhaustive_Deliverable_Register

```ts
export function buildDeliverablesPrompt(ctx: Context): string {
  return `${buildHeader(ctx)}
Using your full prior analysis, produce:

Exhaustive_Deliverable_Register

Markdown table with columns:
| # | Deliverable Name | Clause Ref | Type (Doc / Hardware / Service / Milestone) | Owner | Due Date / Trigger | Predecessor Deliverables | Acceptance Criteria | Status |

RULES:
- Include EVERY deliverable: documents, drawings, hardware, software, training, certifications, milestones, payment milestones, reports.
- "Predecessor Deliverables" links the dependency graph (use "#3, #7" referring to other rows).
- "Acceptance Criteria" must quote contract language where available.
- Mark "Status" as "Not Started" by default unless the source text says otherwise.
- After the table, list deliverables you suspect exist but couldn't confirm and which clause to re-check.`;
}
```

#### c) `prompts/ganttChart.ts` — Gantt Day 0–30

```ts
export function buildGanttPrompt(ctx: Context): string {
  return `${buildHeader(ctx)}
Using the Obligations Register and Deliverable Register, produce:

Gantt Chart — Day 0 to Day 30

Output as a Markdown table:
| Day | Activity | Owner | Predecessor | Deliverable | Risk if Slipped |

Then output a text-based Gantt visualization:

  Day:  0    5    10   15   20   25   30
  A1    [====]
  A2         [========]
  A3              [=====]
  ...

RULES:
- Anchor Day 0 to the contract's Effective Date (or kickoff trigger).
- Sequence activities by their dependencies — predecessors must complete before successors start.
- Mark the critical path with "*" next to the activity ID.
- Identify any activity that, if slipped, blocks more than 2 downstream activities.
- After the chart, list the top 3 schedule risks in Days 0–30.`;
}
```

### 6.5 Daily Brief — `prompts/dailyBrief.ts`

```ts
export function buildDailyBriefPrompt(ctx: Context, sourceText: string): string {
  return `${buildHeader(ctx)}
From the notes / emails / status text below, produce a Daily Brief in this exact structure:

🔴 Urgent
  - <items needing action today, with deadline + owner>

⚠️ Risks
  - <items that may derail delivery, with the affected vendor / milestone>

🟡 Pending Approvals
  - <items waiting on a decision, with who is blocking>

✅ Action Items
  - <concrete next steps, each with owner and due date>

RULES:
- Focus on deadlines, vendors (${ctx.vendors.join(', ') || 'all'}), and delivery risk.
- Each bullet must include WHO and WHEN.
- Do not include anything that is not actionable.
- If a section has no items, write "(none)".

SOURCE:
"""
${sourceText}
"""`;
}
```

### 6.6 Vendor Intelligence — `prompts/vendorIntelligence.ts`

```ts
export function buildVendorIntelPrompt(ctx: Context, sourceText: string): string {
  const vendorList = ctx.vendors.length ? ctx.vendors.join(', ') : 'Hyundai, ABB, GE';
  return `${buildHeader(ctx)}
From the source text below, extract a Vendor Intelligence report.

For each of these vendors — ${vendorList} — and any other vendor mentioned, produce:

### <Vendor Name>
- Mentions: <list of where they appear in the source, with brief context>
- Deadlines linked to this vendor: <date — obligation>
- Risks: <delivery, quality, financial, regulatory>
- Obligations owed BY this vendor: <bulleted>
- Obligations owed TO this vendor: <bulleted>
- Open questions: <items needing clarification>

RULES:
- Do not invent obligations not present in the source.
- If a vendor is mentioned but no obligations are linked, write "Mentioned only — no obligations identified".
- After all vendors, list any vendor name that appeared but you were unsure about (possible typos, abbreviations).

SOURCE:
"""
${sourceText}
"""`;
}
```

### 6.7 `promptBuilder.ts` (barrel)

```ts
export { buildInitPrompt } from './prompts/init';
export { buildContinuePrompt } from './prompts/continueScan';
export { buildObligationsPrompt } from './prompts/obligationsRegister';
export { buildDeliverablesPrompt } from './prompts/deliverableRegister';
export { buildGanttPrompt } from './prompts/ganttChart';
export { buildDailyBriefPrompt } from './prompts/dailyBrief';
export { buildVendorIntelPrompt } from './prompts/vendorIntelligence';
```

---

## 7. Clipboard Utility

`lib/copilot/clipboard.ts`:

```ts
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for non-secure contexts (rare in enterprise, but be defensive)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
```

Pair it with a tiny toast in `CopilotPanel`:

```tsx
const [toast, setToast] = useState<string | null>(null);

async function handleCopy(label: string, prompt: string) {
  const ok = await copyToClipboard(prompt);
  setToast(ok ? `Copied: ${label}` : 'Copy failed — select and copy manually');
  setTimeout(() => setToast(null), 2500);
}
```

---

## 8. State Management (`useState`)

Single source of truth in `CopilotPanel`. No Redux, no Zustand, no Context — overkill for this scope.

```tsx
const [inputText, setInputText] = useState('');
const [context, setContext] = useState<Context>({
  projectName: '',
  vendors: [],
  focus: 'Risk',
});
const [workflow, setWorkflow] = useState<WorkflowState>('idle');
const [outputText, setOutputText] = useState('');
const [toast, setToast] = useState<string | null>(null);

// Derived
const canInit = inputText.trim().length > 50; // crude guard
const canContinue = workflow === 'analyzing' || workflow === 'extracting';
const canOutput = workflow === 'analyzing' || workflow === 'extracting';

// Effects
useEffect(() => {
  if (!canInit) setWorkflow('idle');
  else if (workflow === 'idle') setWorkflow('ready');
}, [canInit]);
```

Button handlers all follow the same pattern:

```tsx
async function onInit() {
  await handleCopy('Init Prompt', buildInitPrompt(context, inputText));
  setWorkflow('analyzing');
}
async function onContinue() {
  await handleCopy('Continue Scan', buildContinuePrompt(context));
}
async function onObligations() {
  await handleCopy('Obligations Register', buildObligationsPrompt(context));
  setWorkflow('extracting');
}
// ...etc.
```

---

## 9. Page Wiring

`pages/copilot-tools.jsx`:

```jsx
import dynamic from 'next/dynamic';
import Layout from '../components/layout/Layout'; // existing app layout

const CopilotPanel = dynamic(
  () => import('../components/copilot/CopilotPanel'),
  { ssr: false }  // clipboard API needs browser
);

export default function CopilotToolsPage() {
  return (
    <Layout>
      <CopilotPanel />
    </Layout>
  );
}
```

`ssr: false` matters: `navigator.clipboard` does not exist in Node, and the panel has no useful server-rendered content.

Add a nav link in `components/layout/<existing-nav>.jsx`:

```jsx
<Link href="/copilot-tools" className="...">Copilot Assistant</Link>
```

---

## 10. Integration with Existing App — "Analyze with Copilot"

Goal: any task in the existing tracker can hand its description to the Copilot Panel in one click.

### 10.1 Mechanism

Use a query param: `/copilot-tools?seed=<base64-encoded-text>`.

In `CopilotPanel.tsx`:

```tsx
useEffect(() => {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const seed = params.get('seed');
  if (seed) {
    try {
      setInputText(decodeURIComponent(atob(seed)));
    } catch {
      // ignore malformed seed
    }
  }
}, []);
```

### 10.2 Task card button

In whatever component renders a task card (e.g. `components/<TaskCard>.jsx`):

```jsx
import Link from 'next/link';

function analyzeHref(task) {
  const seed = btoa(encodeURIComponent(task.description || ''));
  return `/copilot-tools?seed=${seed}`;
}

<Link
  href={analyzeHref(task)}
  className="text-xs text-slate-600 hover:text-slate-900 underline"
>
  Analyze with Copilot
</Link>
```

Result: user clicks the link on a task → `/copilot-tools` opens with the description pre-loaded into the input area → user fills context and clicks Initialize.

> **Cap the seed length** at ~3000 chars before encoding. URLs over ~8KB break in some enterprise proxies. For long contracts, the user pastes manually.

---

## 11. Optional Features (clearly marked)

> Each of these is a *follow-up* — none is required for the MVP.

### 11.1 Output parsing — highlight deadlines (OPTIONAL)

Post-process the captured Copilot output with a regex pass that highlights anything matching `\d{1,2}\s+(days?|weeks?|months?)` or ISO dates, wrapping them in `<mark>`. Adds clarity when reviewing pasted output.

### 11.2 Vendor extraction from output (OPTIONAL)

After paste, scan the output for known vendor names (from `context.vendors`) and produce a small "vendors found" badge bar. Helps the user verify Copilot didn't drop a vendor.

### 11.3 Save session history (OPTIONAL — Supabase)

Schema (`sql/copilot_sessions.sql`):

```sql
create table if not exists copilot_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  project_name text,
  vendors text[],
  focus text,
  input_text text,
  output_text text,
  prompts_used text[],          -- e.g. ['init','continue','continue','obligations']
  created_at timestamptz default now()
);

alter table copilot_sessions enable row level security;
create policy "users can read own sessions"
  on copilot_sessions for select using (auth.uid() = user_id);
create policy "users can insert own sessions"
  on copilot_sessions for insert with check (auth.uid() = user_id);
```

Module: `lib/copilot/sessionStore.ts` — wraps `supabase.from('copilot_sessions')`.

Gate behind a feature flag (`NEXT_PUBLIC_COPILOT_PERSIST=true`) so it stays off by default in regulated environments.

### 11.4 Prompt versioning (OPTIONAL)

Add a `version` field to each prompt module:

```ts
export const INIT_PROMPT_VERSION = '2026-05-05.1';
```

Persist `prompt_versions: { init: '2026-05-05.1', ...}` alongside saved sessions so you can later analyze which prompt versions produced better outputs.

### 11.5 Supabase integration beyond sessions (OPTIONAL)

Pre-populate `context.vendors` and `context.projectName` from the user's profile / project membership tables in Supabase.

---

## 12. Styling Notes

- Stick to existing Tailwind utility classes used elsewhere in the app — match the look of `pages/profile.jsx` and the admin pages.
- Prefer `slate` / `gray` palette for neutrals; reserve a single accent (suggest `indigo-600`) for the primary INIT button.
- Layout: `max-w-6xl mx-auto px-4 py-6` wrapper, `grid grid-cols-1 md:grid-cols-3 gap-6` body.
- All interactive elements need `focus:outline-none focus:ring-2 focus:ring-indigo-500` for keyboard accessibility.
- Toast: fixed bottom-right, `bg-slate-900 text-white px-4 py-2 rounded shadow-lg`, fade out after 2.5s.

---

## 13. Security & Compliance

This module is designed for regulated enterprise environments. Key properties:

| Concern | Mitigation |
|---|---|
| Sending contract text to third-party AI | **None happens here.** All prompts are built locally; Copilot runs in the user's own M365 tenant. |
| Data exfiltration via the panel | The panel makes no outbound network calls in MVP. Optional Supabase save is opt-in and scoped to the authenticated user. |
| Clipboard scraping by other apps | Standard browser sandboxing; the panel only *writes* to the clipboard, never reads from it without user intent. |
| Logging contract text in Sentry | Wrap state in `Sentry.setExtra` only when explicitly debugging; default behavior must scrub `inputText` and `outputText` from breadcrumbs. Add to `sentry.client.config.ts`: `beforeBreadcrumb` filter that drops breadcrumbs originating from `/copilot-tools`. |
| Seed param in URL leaking via referrer | Use `<meta name="referrer" content="no-referrer">` on the `/copilot-tools` page, or strip the `seed` param from the URL after consuming it (`window.history.replaceState`). |

---

## 14. Testing Plan

### 14.1 Unit tests (prompt builders)

Each prompt builder is a pure function — test with a snapshot per prompt:

```ts
// __tests__/promptBuilder.test.ts
import { buildInitPrompt } from '../lib/copilot/promptBuilder';

test('init prompt includes coverage checklist instruction', () => {
  const out = buildInitPrompt(
    { projectName: 'Phase 2', vendors: ['Hyundai'], focus: 'Risk' },
    'CONTRACT BODY'
  );
  expect(out).toMatch(/Coverage Checklist/);
  expect(out).toMatch(/DO NOT summarize/);
  expect(out).toContain('CONTRACT BODY');
  expect(out).toContain('Hyundai');
});
```

Repeat for each builder. Snapshot the full string for regression coverage.

### 14.2 Component tests

- Render `<CopilotPanel />` with React Testing Library.
- Assert INIT button is disabled with empty input, enabled after typing >50 chars.
- Mock `navigator.clipboard.writeText`; click INIT; assert toast appears and `writeText` called with the expected prompt prefix.
- Assert workflow state transitions (`idle → ready → analyzing → extracting`).

### 14.3 Manual QA checklist

- [ ] Paste a real contract (~15 pages) → click Initialize → paste into Copilot → verify Copilot produces a Coverage Checklist before any analysis.
- [ ] Click Continue Scan 3 times in Copilot → verify Copilot resumes from the next pending item without re-summarizing.
- [ ] Click Obligations Register → verify Copilot produces a properly formatted Markdown table.
- [ ] Click Gantt → verify Day 0–30 sequencing references the obligations from the prior pass.
- [ ] Daily Brief with email text → verify all four sections appear (🔴 ⚠️ 🟡 ✅).
- [ ] Vendor Intelligence with Hyundai/ABB context → verify per-vendor sections.
- [ ] Test on Edge (most enterprise installs) and Chrome.
- [ ] Test clipboard on `http://localhost` (insecure context fallback) and HTTPS (native API).
- [ ] Click "Analyze with Copilot" from a task card → verify input pre-populates.

---

## 15. Implementation Checklist

**Phase 1 — Skeleton (½ day)**
- [ ] Create `pages/copilot-tools.jsx` with `Layout` wrapper.
- [ ] Add nav link.
- [ ] Create empty `components/copilot/` folder with stub files.
- [ ] Verify route renders.

**Phase 2 — Prompts & utilities (½ day)**
- [ ] Implement all seven prompt modules in `lib/copilot/prompts/`.
- [ ] Implement `clipboard.ts`.
- [ ] Add unit tests for each prompt builder (snapshot).

**Phase 3 — Components (1 day)**
- [ ] `InputSection.tsx` with controlled textarea.
- [ ] `ContextBuilder.tsx` with project/vendors/focus.
- [ ] `WorkflowEngine.tsx` with INIT / CONTINUE / OUTPUT buttons + state badges.
- [ ] `AdditionalTools.tsx` with Daily Brief + Vendor Intelligence.
- [ ] `InstructionsPanel.tsx` (static).
- [ ] `OutputCapture.tsx` with optional textarea.

**Phase 4 — Integration (½ day)**
- [ ] Wire all components together in `CopilotPanel.tsx`.
- [ ] Hook handlers to `promptBuilder` + clipboard.
- [ ] Add toast notifications.
- [ ] Implement workflow state transitions.

**Phase 5 — Cross-app integration (¼ day)**
- [ ] Add `?seed=` consumption in `CopilotPanel`.
- [ ] Add "Analyze with Copilot" link to task card.
- [ ] Strip seed from URL after read.

**Phase 6 — Polish & QA (½ day)**
- [ ] Tailwind pass — match app's existing style.
- [ ] Sentry breadcrumb filter for `/copilot-tools`.
- [ ] Run manual QA checklist.
- [ ] Mobile responsive review.

**Phase 7 — Optional follow-ups (separate PRs)**
- [ ] Supabase session persistence (behind feature flag).
- [ ] Output parsing / deadline highlighting.
- [ ] Vendor extraction from output.
- [ ] Prompt versioning.

**Total estimated effort for MVP (Phases 1–6): ~3 working days.**

---

## 16. Future Roadmap

| Theme | Item | Notes |
|---|---|---|
| Prompt quality | Version control on prompts | Store hash/version per session; A/B compare |
| Prompt quality | Prompt diffs viewer | Internal admin page showing prompt evolution |
| Analytics | Workflow usage tracking | Which prompts are used most? Which projects use Gantt vs Obligations? |
| Analytics | Time-to-output metric | From INIT click to first OUTPUT click — proxy for analysis depth |
| Session tracking | Resume incomplete sessions | "You ran INIT 2 hours ago — resume?" |
| Session tracking | Multi-user shared sessions | Collaborator can pick up where you left off |
| Knowledge base | Internal vendor profiles | Pre-fill known risks for Hyundai/ABB/GE from internal KB |
| Knowledge base | Past contract lookup | "Similar clause was negotiated in Project X" hints |
| Workflow | Custom workflow templates | Power users define their own INIT → ... → OUTPUT chains |
| Integration | Outlook plugin | Right-click email → "Send to Copilot Brief" |
| Integration | Teams adaptive card | Run Daily Brief from a Teams shortcut |

---

## 17. Architectural Notes & Trade-offs

- **Why frontend-only?** The constraint is firm — no backend AI, no external APIs. This actually simplifies the system: prompts are pure functions, state is local, and the security review is trivial. There is no server-side risk surface.
- **Why pages router instead of app router?** The existing project uses pages router (`pages/`). Don't mix routers — it causes layout/auth context bugs.
- **Why TypeScript only for `CopilotPanel.tsx`?** The prompt builders benefit most from TS (the `Context` type is used everywhere). The existing app is JS-first; introducing TS for the whole module would require touching `tsconfig.json` more aggressively. Confine TS to `lib/copilot/` and the panel root, keep the page file as `.jsx`.
- **Why dynamic import with `ssr: false`?** `navigator.clipboard` is undefined on the server and the panel produces no SEO-relevant content. SSR adds nothing here.
- **Why no real Copilot API?** Microsoft does not expose Copilot for M365 to third-party web apps; it runs only inside the customer's tenant. This panel is the correct shape of the problem given that constraint.
- **Why prompts as separate files?** They will change frequently as you learn what makes Copilot behave. Keeping them isolated lets you iterate without touching React code, and makes future prompt versioning straightforward.

---

## 18. Final Note

This system exists to **overcome Copilot's defaults**, not to be clever. Every UX decision — the step badges, the "Coverage Checklist first" instruction, the forced CONTINUE loop, the structured table outputs — exists because Copilot, left to its own devices, will summarize a 200-page contract into 7 bullets and miss the indemnity clause that costs you the project.

Build it like a cockpit: deterministic buttons, predictable state, no surprises. The user is the pilot; Copilot is the engine; this panel is the flight director that keeps the engine on course.
