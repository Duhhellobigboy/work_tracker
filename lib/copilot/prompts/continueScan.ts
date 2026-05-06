import { Context } from '../../../components/copilot/types';

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
