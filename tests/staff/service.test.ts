import { beforeEach, describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => ({
  createStaffAccount: vi.fn(),
  findAccountByEmail: vi.fn(),
  findMember: vi.fn(),
  listCurrentStaff: vi.fn(),
  markRemoved: vi.fn(),
  rejoinAsStaff: vi.fn(),
}));
const session = vi.hoisted(() => ({ revokeAllSessions: vi.fn() }));

vi.mock('@/lib/staff/queries', () => queries);
vi.mock('@/components/auth/session', () => session);

import { addStaff, loadStaff, removeStaff } from '@/lib/staff/service';

const goodPassword = 'Flat-white-2026';

beforeEach(() => {
  vi.clearAllMocks();
  queries.findAccountByEmail.mockResolvedValue(null);
});

describe('adding staff', () => {
  it('creates an account that must choose its own password', async () => {
    const outcome = await addStaff({ name: 'Sam', email: 'Sam@Cafe.test', password: goodPassword });
    expect(outcome).toEqual({ ok: true });
    const created = queries.createStaffAccount.mock.calls[0]?.[0];
    expect(created).toMatchObject({ name: 'Sam', email: 'sam@cafe.test' });
    expect(created.passwordHash).not.toBe(goodPassword);
  });

  it('refuses a weak starting password', async () => {
    const outcome = await addStaff({ name: 'Sam', email: 'sam@cafe.test', password: 'coffee' });
    expect(outcome.ok).toBe(false);
    expect(queries.createStaffAccount).not.toHaveBeenCalled();
  });

  it('refuses someone already on the staff list', async () => {
    queries.findAccountByEmail.mockResolvedValue({
      userId: 'u-1',
      member: { id: 'm-1', removedAt: null },
    });
    const outcome = await addStaff({ name: 'Sam', email: 'sam@cafe.test', password: goodPassword });
    expect(outcome).toMatchObject({ ok: false, status: 409 });
  });

  it('brings back someone who left, with a new starting password', async () => {
    queries.findAccountByEmail.mockResolvedValue({
      userId: 'u-1',
      member: { id: 'm-1', removedAt: new Date() },
    });
    const outcome = await addStaff({ name: 'Sam', email: 'sam@cafe.test', password: goodPassword });
    expect(outcome).toEqual({ ok: true });
    expect(queries.rejoinAsStaff).toHaveBeenCalled();
    expect(session.revokeAllSessions).toHaveBeenCalledWith('u-1');
  });
});

describe('removing staff', () => {
  it('stops their sign-in', async () => {
    queries.findMember.mockResolvedValue({
      id: 'm-sam',
      userId: 'u-sam',
      role: 'staff',
      removedAt: null,
    });
    expect(await removeStaff({ memberId: 'm-sam', managerId: 'm-boss' })).toEqual({ ok: true });
    expect(queries.markRemoved).toHaveBeenCalledWith({ memberId: 'm-sam', userId: 'u-sam' });
    expect(session.revokeAllSessions).toHaveBeenCalledWith('u-sam');
  });

  it('never removes the manager', async () => {
    queries.findMember.mockResolvedValue({
      id: 'm-boss',
      userId: 'u-boss',
      role: 'manager',
      removedAt: null,
    });
    const outcome = await removeStaff({ memberId: 'm-boss', managerId: 'm-boss' });
    expect(outcome.ok).toBe(false);
    expect(queries.markRemoved).not.toHaveBeenCalled();
  });

  it('lists the manager first, then by name', async () => {
    queries.listCurrentStaff.mockResolvedValue([
      { memberId: '2', name: 'Zoe', email: '', role: 'staff', mustChangePassword: false },
      { memberId: '3', name: 'Ali', email: '', role: 'staff', mustChangePassword: false },
      { memberId: '1', name: 'Max', email: '', role: 'manager', mustChangePassword: false },
    ]);
    const names = (await loadStaff()).map((person) => person.name);
    expect(names).toEqual(['Max', 'Ali', 'Zoe']);
  });
});
