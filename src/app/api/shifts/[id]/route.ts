import { requireManager } from '@/lib/members/access';
import { fromOutcome } from '@/lib/http/reply';
import { removeShift } from '@/lib/rota/service';

/** `DELETE /api/shifts/:id` — the manager takes a shift off the rota. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireManager();
  if (!access.ok) return access.response;

  const { id } = await context.params;
  return fromOutcome(await removeShift(id));
}
