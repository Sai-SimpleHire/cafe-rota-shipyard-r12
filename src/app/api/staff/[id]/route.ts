import { fromOutcome } from '@/lib/http/reply';
import { requireManager } from '@/lib/members/access';
import { removeStaff } from '@/lib/staff/service';

/** `DELETE /api/staff/:id` — the manager removes someone who has left. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireManager();
  if (!access.ok) return access.response;

  const { id } = await context.params;
  return fromOutcome(await removeStaff({ memberId: id, managerId: access.member.id }));
}
