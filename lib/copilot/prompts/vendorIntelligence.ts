import { Context } from '../../../components/copilot/types';
import { buildHeader } from './init';

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
