import { Context } from '../../../components/copilot/types';
import { buildHeader } from './init';

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
