import { Context } from '../../../components/copilot/types';

export function buildHeader(ctx: Context): string {
  return [
    `Project: ${ctx.projectName || 'N/A'}`,
    `Vendors of interest: ${ctx.vendors.join(', ') || 'N/A'}`,
    `Analysis focus: ${ctx.focus}`,
    '',
  ].join('\n');
}

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
