import { beforeEach, describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => ({
  createShift: vi.fn(),
  deleteShift: vi.fn(),
  findOrCreateWeek: vi.fn(),
  findShift: vi.fn(),
  findWeek: vi.fn(),
  isActiveMember: vi.fn(),
  listPublishedShiftsFor: vi.fn(),
  listShiftsInWeek: vi.fn(),
  markPublished: vi.fn(),
}));

vi.mock('@/lib/rota/queries', () => queries);
vi.mock('@/lib/members/queries', () => ({
  listActiveMembers: vi.fn(async () => []),
  namesForMembers: vi.fn(async () => new Map()),
}));

import { newShiftSchema } from '@/lib/rota/schema';
import { addShift, loadWeekPlan, publishWeek } from '@/lib/rota/service';

beforeEach(() => {
  vi.clearAllMocks();
  queries.findOrCreateWeek.mockResolvedValue({
    id: 'week-1',
    startsOn: '2026-11-09',
    publishedAt: null,
  });
  queries.isActiveMember.mockResolvedValue(true);
});

const thursday = { day: '2026-11-12', starts: '09:00', ends: '15:00', memberId: 'm-sam' };

describe('adding a shift', () => {
  it('files it under the week that holds its day', async () => {
    expect(await addShift(thursday)).toEqual({ ok: true });
    expect(queries.findOrCreateWeek).toHaveBeenCalledWith('2026-11-09');
    expect(queries.createShift).toHaveBeenCalledWith({
      weekId: 'week-1',
      day: '2026-11-12',
      startMinute: 540,
      endMinute: 900,
      memberId: 'm-sam',
    });
  });

  it('refuses a shift that ends before it starts', async () => {
    const outcome = await addShift({ ...thursday, starts: '15:00', ends: '09:00' });
    expect(outcome.ok).toBe(false);
    expect(queries.createShift).not.toHaveBeenCalled();
    expect(newShiftSchema.safeParse({ ...thursday, ends: '08:00' }).success).toBe(false);
  });

  it('refuses someone who has left', async () => {
    queries.isActiveMember.mockResolvedValue(false);
    const outcome = await addShift(thursday);
    expect(outcome.ok).toBe(false);
    expect(queries.createShift).not.toHaveBeenCalled();
  });
});

describe('publishing', () => {
  it('marks a draft week published', async () => {
    await publishWeek('2026-11-14');
    expect(queries.findOrCreateWeek).toHaveBeenCalledWith('2026-11-09');
    expect(queries.markPublished).toHaveBeenCalledWith('week-1');
  });

  it('leaves an already published week alone', async () => {
    queries.findOrCreateWeek.mockResolvedValue({
      id: 'week-1',
      startsOn: '2026-11-09',
      publishedAt: new Date(),
    });
    await publishWeek('2026-11-09');
    expect(queries.markPublished).not.toHaveBeenCalled();
  });

  it('treats a week nobody has touched as an empty draft', async () => {
    queries.findWeek.mockResolvedValue(null);
    const plan = await loadWeekPlan('2026-11-11');
    expect(plan).toMatchObject({ monday: '2026-11-09', isPublished: false, shifts: [] });
  });
});
