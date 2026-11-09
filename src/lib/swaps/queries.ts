import { prisma } from '@/lib/prisma';
import { toIsoDate } from '@/lib/rota/time';

/** Database reads and writes for swap requests. One café, so nothing to scope by. */

export type SwapStatus = 'waiting' | 'approved' | 'declined';

export interface SwapRecord {
  id: string;
  shiftId: string;
  fromMemberId: string;
  toMemberId: string;
  status: SwapStatus;
  createdAt: Date;
  shift: { day: string; startMinute: number; endMinute: number; memberId: string };
}

function toStatus(value: string): SwapStatus {
  if (value === 'approved' || value === 'declined') return value;
  return 'waiting';
}

const swapSelect = {
  id: true,
  shiftId: true,
  fromMemberId: true,
  toMemberId: true,
  status: true,
  createdAt: true,
  shift: { select: { day: true, startMinute: true, endMinute: true, memberId: true } },
} as const;

type SwapRow = Omit<SwapRecord, 'status' | 'shift'> & {
  status: string;
  shift: { day: Date; startMinute: number; endMinute: number; memberId: string };
};

function toSwap(row: SwapRow): SwapRecord {
  return {
    ...row,
    status: toStatus(row.status),
    shift: { ...row.shift, day: toIsoDate(row.shift.day) },
  };
}

export async function listSwapsNewestFirst(): Promise<SwapRecord[]> {
  const rows = await prisma.swapRequest.findMany({
    select: swapSelect,
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toSwap);
}

/** The latest request on each of these shifts, so a card can say where its swap stands. */
export async function latestSwapsForShifts(shiftIds: string[]): Promise<SwapRecord[]> {
  const rows = await prisma.swapRequest.findMany({
    where: { shiftId: { in: shiftIds } },
    select: swapSelect,
    orderBy: { createdAt: 'desc' },
  });
  const seen = new Set<string>();
  return rows.map(toSwap).filter((swap) => {
    if (seen.has(swap.shiftId)) return false;
    seen.add(swap.shiftId);
    return true;
  });
}

export async function findSwap(swapId: string): Promise<SwapRecord | null> {
  const row = await prisma.swapRequest.findUnique({ where: { id: swapId }, select: swapSelect });
  return row ? toSwap(row) : null;
}

export async function hasWaitingSwap(shiftId: string): Promise<boolean> {
  const count = await prisma.swapRequest.count({ where: { shiftId, status: 'waiting' } });
  return count > 0;
}

export async function findShiftForSwap(shiftId: string) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    select: { id: true, memberId: true, day: true, week: { select: { publishedAt: true } } },
  });
  if (!shift) return null;
  return {
    id: shift.id,
    memberId: shift.memberId,
    day: toIsoDate(shift.day),
    isPublished: shift.week.publishedAt !== null,
  };
}

export async function createSwap(input: {
  shiftId: string;
  fromMemberId: string;
  toMemberId: string;
}): Promise<void> {
  await prisma.swapRequest.create({ data: input });
}

/** The rota changes here and only here: the shift moves to the colleague. */
export async function approveSwap(swap: { id: string; shiftId: string; toMemberId: string }) {
  const now = new Date();
  await prisma.$transaction([
    prisma.shift.update({ where: { id: swap.shiftId }, data: { memberId: swap.toMemberId } }),
    prisma.swapRequest.update({
      where: { id: swap.id },
      data: { status: 'approved', decidedAt: now },
    }),
  ]);
}

export async function declineSwap(swapId: string): Promise<void> {
  await prisma.swapRequest.update({
    where: { id: swapId },
    data: { status: 'declined', decidedAt: new Date() },
  });
}
