import { Context } from '../../../components/copilot/types';
import { buildHeader } from './init';

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
