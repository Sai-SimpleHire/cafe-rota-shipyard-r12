import { listActiveMembers, namesForMembers, type ColleagueRecord } from '@/lib/members/queries';

import {
  createShift,
  deleteShift,
  findOrCreateWeek,
  findShift,
  findWeek,
  isActiveMember,
  listPublishedShiftsFor,
  listShiftsInWeek,
  markPublished,
  type ShiftRecord,
} from './queries';
import type { NewShift } from './schema';
import { mondayOf, parseTime } from './time';

export type Outcome = { ok: true } | { ok: false; message: string; status: number };

export interface WeekPlan {
  monday: string;
  isPublished: boolean;
  shifts: ShiftRecord[];
  people: ColleagueRecord[];
  /** Names of everyone on a shift this week, including anyone who has left. */
  names: Map<string, string>;
}

/** Everything the Plan the week screen shows. A week with no row yet is an empty draft. */
export async function loadWeekPlan(anyDayInWeek: string): Promise<WeekPlan> {
  const monday = mondayOf(anyDayInWeek);
  const [week, people] = await Promise.all([findWeek(monday), listActiveMembers()]);
  const shifts = week ? await listShiftsInWeek(week.id) : [];
  const names = await namesForMembers(shifts.map((shift) => shift.memberId));
  return { monday, isPublished: Boolean(week?.publishedAt), shifts, people, names };
}

export async function addShift(shift: NewShift): Promise<Outcome> {
  const startMinute = parseTime(shift.starts);
  const endMinute = parseTime(shift.ends);
  if (startMinute === null || endMinute === null || endMinute <= startMinute) {
    return { ok: false, message: 'The shift has to end after it starts.', status: 400 };
  }
  if (!(await isActiveMember(shift.memberId))) {
    return { ok: false, message: 'That person is no longer on the staff list.', status: 400 };
  }
  const week = await findOrCreateWeek(mondayOf(shift.day));
  await createShift({
    weekId: week.id,
    day: shift.day,
    startMinute,
    endMinute,
    memberId: shift.memberId,
  });
  return { ok: true };
}

export async function removeShift(shiftId: string): Promise<Outcome> {
  const shift = await findShift(shiftId);
  if (!shift) return { ok: false, message: 'That shift has already gone.', status: 404 };
  await deleteShift(shiftId);
  return { ok: true };
}

/** Publishing is what lets staff see a week; until then it is the manager's draft. */
export async function publishWeek(anyDayInWeek: string): Promise<Outcome> {
  const week = await findOrCreateWeek(mondayOf(anyDayInWeek));
  if (week.publishedAt) return { ok: true };
  await markPublished(week.id);
  return { ok: true };
}

/** A member's own shifts that staff are allowed to see: published weeks only, soonest first. */
export function loadMyShifts(memberId: string, fromDay: string): Promise<ShiftRecord[]> {
  return listPublishedShiftsFor(memberId, fromDay);
}
