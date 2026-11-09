import { validateBody } from '@/seams/validate';
import { fromOutcome, invalid } from '@/lib/http/reply';
import { requireManager } from '@/lib/members/access';
import { swapDecisionSchema } from '@/lib/swaps/schema';
import { decideSwap } from '@/lib/swaps/service';

/** `POST /api/swaps/:id/decision` — the manager approves or turns down a swap. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireManager();
  if (!access.ok) return access.response;

  const body = await validateBody(request, swapDecisionSchema);
  if (!body.ok) return invalid(body);

  const { id } = await context.params;
  return fromOutcome(await decideSwap({ swapId: id, decision: body.data.decision }));
}
