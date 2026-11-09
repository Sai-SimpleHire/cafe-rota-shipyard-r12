import { listActiveMembers, namesForMembers } from '@/lib/members/queries';
import { loadMyShifts } from '@/lib/rota/service';
import { addDays, toIsoDate } from '@/lib/rota/time';
import { latestSwapsForShifts, type SwapStatus } from '@/lib/swaps/queries';

/** What the My shifts screen shows: one entry per upcoming published shift. */

export interface MyShift {
  id: string;
  day: string;
  startMinute: number;
  endMinute: number;
  swap: { status: SwapStatus; colleague: string } | null;
}

export interface MyShiftsView {
  shifts: MyShift[];
  colleagues: { id: string; name: string }[];
}

export async function loadMyShiftsView(memberId: string, now: Date): Promise<MyShiftsView> {
  // A day early, because the café's "today" may still be yesterday in UTC; the
  // screen drops anything before the person's own today.
  const fromDay = addDays(toIsoDate(now), -1);
  const shifts = await loadMyShifts(memberId, fromDay);
  const swaps = await latestSwapsForShifts(shifts.map((shift) => shift.id));
  const names = await namesForMembers(swaps.map((swap) => swap.toMemberId));
  const swapByShift = new Map(swaps.map((swap) => [swap.shiftId, swap]));
  const everyone = await listActiveMembers();

  return {
    shifts: shifts.map((shift) => {
      const swap = swapByShift.get(shift.id);
      // A request from whoever held this shift before does not belong on this card.
      const isMine = swap && swap.fromMemberId === memberId;
      return {
        id: shift.id,
        day: shift.day,
        startMinute: shift.startMinute,
        endMinute: shift.endMinute,
        swap: isMine
          ? { status: swap.status, colleague: names.get(swap.toMemberId) ?? 'a colleague' }
          : null,
      };
    }),
    colleagues: everyone.filter((person) => person.id !== memberId),
  };
}
