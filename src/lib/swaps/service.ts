import { namesForMembers } from '@/lib/members/queries';
import { isActiveMember } from '@/lib/rota/queries';

import {
  approveSwap,
  createSwap,
  declineSwap,
  findShiftForSwap,
  findSwap,
  hasWaitingSwap,
  listSwapsNewestFirst,
  type SwapRecord,
} from './queries';
import type { AskSwap } from './schema';

export type Outcome = { ok: true } | { ok: false; message: string; status: number };

const refuse = (message: string, status = 400): Outcome => ({ ok: false, message, status });

/**
 * A staff member asks for a colleague to take one of their own published
 * shifts. Nothing on the rota changes until the manager approves.
 */
export async function askForSwap(input: AskSwap & { memberId: string }): Promise<Outcome> {
  const shift = await findShiftForSwap(input.shiftId);
  // Someone else's shift, or one in an unpublished week, is answered as "not found":
  // staff should not learn anything about shifts they cannot see.
  if (!shift || shift.memberId !== input.memberId || !shift.isPublished) {
    return refuse('That shift is not one of yours.', 404);
  }
  if (input.toMemberId === input.memberId) return refuse('Please choose a colleague.');
  if (!(await isActiveMember(input.toMemberId))) {
    return refuse('That colleague is no longer on the staff list.');
  }
  if (await hasWaitingSwap(shift.id)) {
    return refuse('You have already asked to swap this shift. The manager will decide.', 409);
  }
  await createSwap({
    shiftId: shift.id,
    fromMemberId: input.memberId,
    toMemberId: input.toMemberId,
  });
  return { ok: true };
}

export type SwapWithNames = SwapRecord & { fromName: string; toName: string };

/** Every request, newest first, with the names of the two people in it. */
export async function loadSwapRequests(): Promise<SwapWithNames[]> {
  const swaps = await listSwapsNewestFirst();
  const names = await namesForMembers(
    swaps.flatMap((swap) => [swap.fromMemberId, swap.toMemberId]),
  );
  return swaps.map((swap) => ({
    ...swap,
    fromName: names.get(swap.fromMemberId) ?? 'Unknown',
    toName: names.get(swap.toMemberId) ?? 'Unknown',
  }));
}

/**
 * The manager approves or turns down a waiting request. An approval only goes
 * through while the shift is still the asker's and the colleague still works here;
 * otherwise the rota would change under somebody who no longer expects it.
 */
export async function decideSwap(input: {
  swapId: string;
  decision: 'approve' | 'decline';
}): Promise<Outcome> {
  const swap = await findSwap(input.swapId);
  if (!swap) return refuse('That swap request has gone.', 404);
  if (swap.status !== 'waiting') return refuse('That swap request has already been decided.', 409);

  if (input.decision === 'decline') {
    await declineSwap(swap.id);
    return { ok: true };
  }
  if (swap.shift.memberId !== swap.fromMemberId) {
    return refuse('That shift has been given to someone else since. Turn this request down.', 409);
  }
  if (!(await isActiveMember(swap.toMemberId))) {
    return refuse('The colleague has left the café. Turn this request down.', 409);
  }
  await approveSwap(swap);
  return { ok: true };
}
