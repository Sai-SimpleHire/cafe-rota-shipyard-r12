import { beforeEach, describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => ({
  approveSwap: vi.fn(),
  createSwap: vi.fn(),
  declineSwap: vi.fn(),
  findShiftForSwap: vi.fn(),
  findSwap: vi.fn(),
  hasWaitingSwap: vi.fn(),
  listSwapsNewestFirst: vi.fn(),
}));
const rota = vi.hoisted(() => ({ isActiveMember: vi.fn() }));

vi.mock('@/lib/swaps/queries', () => queries);
vi.mock('@/lib/rota/queries', () => rota);
vi.mock('@/lib/members/queries', () => ({ namesForMembers: vi.fn(async () => new Map()) }));

import { askForSwap, decideSwap } from '@/lib/swaps/service';

const samsShift = { id: 'shift-1', memberId: 'm-sam', day: '2026-11-12', isPublished: true };

const waitingSwap = {
  id: 'swap-1',
  shiftId: 'shift-1',
  fromMemberId: 'm-sam',
  toMemberId: 'm-jo',
  status: 'waiting',
  createdAt: new Date(),
  shift: { day: '2026-11-12', startMinute: 540, endMinute: 900, memberId: 'm-sam' },
};

beforeEach(() => {
  vi.clearAllMocks();
  queries.findShiftForSwap.mockResolvedValue(samsShift);
  queries.hasWaitingSwap.mockResolvedValue(false);
  queries.findSwap.mockResolvedValue(waitingSwap);
  rota.isActiveMember.mockResolvedValue(true);
});

const ask = { shiftId: 'shift-1', toMemberId: 'm-jo' };

describe('asking for a swap', () => {
  it('records the request without touching the rota', async () => {
    expect(await askForSwap({ ...ask, memberId: 'm-sam' })).toEqual({ ok: true });
    expect(queries.createSwap).toHaveBeenCalledWith({
      shiftId: 'shift-1',
      fromMemberId: 'm-sam',
      toMemberId: 'm-jo',
    });
    expect(queries.approveSwap).not.toHaveBeenCalled();
  });

  it('refuses a shift that belongs to somebody else', async () => {
    const outcome = await askForSwap({ ...ask, memberId: 'm-alex' });
    expect(outcome).toMatchObject({ ok: false, status: 404 });
    expect(queries.createSwap).not.toHaveBeenCalled();
  });

  it('refuses a shift in a week that is not published', async () => {
    queries.findShiftForSwap.mockResolvedValue({ ...samsShift, isPublished: false });
    const outcome = await askForSwap({ ...ask, memberId: 'm-sam' });
    expect(outcome).toMatchObject({ ok: false, status: 404 });
  });

  it('refuses swapping with yourself or with someone who has left', async () => {
    expect((await askForSwap({ ...ask, toMemberId: 'm-sam', memberId: 'm-sam' })).ok).toBe(false);
    rota.isActiveMember.mockResolvedValue(false);
    expect((await askForSwap({ ...ask, memberId: 'm-sam' })).ok).toBe(false);
    expect(queries.createSwap).not.toHaveBeenCalled();
  });

  it('refuses a second request while one is waiting', async () => {
    queries.hasWaitingSwap.mockResolvedValue(true);
    const outcome = await askForSwap({ ...ask, memberId: 'm-sam' });
    expect(outcome).toMatchObject({ ok: false, status: 409 });
  });
});

describe('the manager deciding', () => {
  it('moves the shift only on approval', async () => {
    expect(await decideSwap({ swapId: 'swap-1', decision: 'approve' })).toEqual({ ok: true });
    expect(queries.approveSwap).toHaveBeenCalledWith(waitingSwap);
  });

  it('leaves the rota alone when turned down', async () => {
    expect(await decideSwap({ swapId: 'swap-1', decision: 'decline' })).toEqual({ ok: true });
    expect(queries.declineSwap).toHaveBeenCalledWith('swap-1');
    expect(queries.approveSwap).not.toHaveBeenCalled();
  });

  it('cannot decide the same request twice', async () => {
    queries.findSwap.mockResolvedValue({ ...waitingSwap, status: 'approved' });
    const outcome = await decideSwap({ swapId: 'swap-1', decision: 'approve' });
    expect(outcome).toMatchObject({ ok: false, status: 409 });
    expect(queries.approveSwap).not.toHaveBeenCalled();
  });

  it('will not approve once the shift has moved to someone else', async () => {
    queries.findSwap.mockResolvedValue({
      ...waitingSwap,
      shift: { ...waitingSwap.shift, memberId: 'm-alex' },
    });
    const outcome = await decideSwap({ swapId: 'swap-1', decision: 'approve' });
    expect(outcome.ok).toBe(false);
    expect(queries.approveSwap).not.toHaveBeenCalled();
  });

  it('will not approve when the colleague has left', async () => {
    rota.isActiveMember.mockResolvedValue(false);
    const outcome = await decideSwap({ swapId: 'swap-1', decision: 'approve' });
    expect(outcome.ok).toBe(false);
    expect(queries.approveSwap).not.toHaveBeenCalled();
  });
});
