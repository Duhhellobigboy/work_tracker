import { Context } from '../../../components/copilot/types';
import { buildHeader } from './init';

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
