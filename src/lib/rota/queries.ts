import { prisma } from '@/lib/prisma';

import { fromIsoDate, toIsoDate } from './time';

/** Database reads and writes for weeks and shifts. One café, so nothing to scope by. */

export interface WeekRecord {
  id: string;
  startsOn: string;
  publishedAt: Date | null;
}

export interface ShiftRecord {
  id: string;
  day: string;
  startMinute: number;
  endMinute: number;
  memberId: string;
  isMemberGone: boolean;
  userId: string;
}

export async function findWeek(monday: string): Promise<WeekRecord | null> {
  const week = await prisma.rotaWeek.findUnique({ where: { startsOn: fromIsoDate(monday) } });
  if (!week) return null;
  return { id: week.id, startsOn: toIsoDate(week.startsOn), publishedAt: week.publishedAt };
}

export async function findOrCreateWeek(monday: string): Promise<WeekRecord> {
  const week = await prisma.rotaWeek.upsert({
    where: { startsOn: fromIsoDate(monday) },
    create: { startsOn: fromIsoDate(monday) },
    update: {},
  });
  return { id: week.id, startsOn: toIsoDate(week.startsOn), publishedAt: week.publishedAt };
}

export async function markPublished(weekId: string): Promise<void> {
  await prisma.rotaWeek.update({ where: { id: weekId }, data: { publishedAt: new Date() } });
}

const shiftSelect = {
  id: true,
  day: true,
  startMinute: true,
  endMinute: true,
  memberId: true,
  member: { select: { removedAt: true, userId: true } },
} as const;

type ShiftRow = {
  id: string;
  day: Date;
  startMinute: number;
  endMinute: number;
  memberId: string;
  member: { removedAt: Date | null; userId: string };
};

function toShift(row: ShiftRow): ShiftRecord {
  return {
    id: row.id,
    day: toIsoDate(row.day),
    startMinute: row.startMinute,
    endMinute: row.endMinute,
    memberId: row.memberId,
    isMemberGone: row.member.removedAt !== null,
    userId: row.member.userId,
  };
}

const soonestFirst = [{ day: 'asc' as const }, { startMinute: 'asc' as const }];

export async function listShiftsInWeek(weekId: string): Promise<ShiftRecord[]> {
  const rows = await prisma.shift.findMany({
    where: { weekId },
    select: shiftSelect,
    orderBy: soonestFirst,
  });
  return rows.map(toShift);
}

/** A member's shifts in published weeks, from this date on. */
export async function listPublishedShiftsFor(
  memberId: string,
  fromDay: string,
): Promise<ShiftRecord[]> {
  const rows = await prisma.shift.findMany({
    where: {
      memberId,
      day: { gte: fromIsoDate(fromDay) },
      week: { publishedAt: { not: null } },
    },
    select: shiftSelect,
    orderBy: soonestFirst,
  });
  return rows.map(toShift);
}

export async function createShift(input: {
  weekId: string;
  day: string;
  startMinute: number;
  endMinute: number;
  memberId: string;
}): Promise<void> {
  await prisma.shift.create({ data: { ...input, day: fromIsoDate(input.day) } });
}

export async function findShift(shiftId: string): Promise<ShiftRecord | null> {
  const row = await prisma.shift.findUnique({ where: { id: shiftId }, select: shiftSelect });
  return row ? toShift(row) : null;
}

/** Deleting a shift also deletes its swap requests (cascade in the schema). */
export async function deleteShift(shiftId: string): Promise<void> {
  await prisma.shift.delete({ where: { id: shiftId } });
}

export async function isActiveMember(memberId: string): Promise<boolean> {
  const member = await prisma.cafeMember.findUnique({
    where: { id: memberId },
    select: { removedAt: true },
  });
  return member !== null && member.removedAt === null;
}
