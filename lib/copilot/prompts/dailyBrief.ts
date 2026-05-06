import { Context } from '../../../components/copilot/types';
import { buildHeader } from './init';

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
