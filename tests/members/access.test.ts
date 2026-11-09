import { beforeEach, describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => ({
  findMemberByUserId: vi.fn(),
  hasManager: vi.fn(),
  createManager: vi.fn(),
}));
const auth = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock('@/lib/members/queries', () => queries);
vi.mock('@/seams/auth', () => auth);

import { requireManager, requireMember, requireStartingPassword } from '@/lib/members/access';
import { resolveMember } from '@/lib/members/service';

const record = (role: string, removedAt: Date | null = null) => ({
  id: `member-${role}`,
  userId: 'user-1',
  role,
  mustChangePassword: false,
  removedAt,
});

beforeEach(() => {
  vi.clearAllMocks();
  auth.getCurrentUser.mockResolvedValue({ id: 'user-1', email: 'a@cafe.test', name: 'Ana' });
});

describe('who someone is on the rota', () => {
  it('makes the very first account the manager', async () => {
    queries.findMemberByUserId.mockResolvedValue(null);
    queries.hasManager.mockResolvedValue(false);
    queries.createManager.mockResolvedValue(record('manager'));
    expect((await resolveMember('user-1'))?.role).toBe('manager');
  });

  it('gives a later self-made account no place on the rota', async () => {
    queries.findMemberByUserId.mockResolvedValue(null);
    queries.hasManager.mockResolvedValue(true);
    expect(await resolveMember('user-1')).toBeNull();
    expect(queries.createManager).not.toHaveBeenCalled();
  });

  it('gives someone who has left no place on the rota', async () => {
    queries.findMemberByUserId.mockResolvedValue(record('staff', new Date()));
    expect(await resolveMember('user-1')).toBeNull();
  });
});

describe('what the server lets through', () => {
  it('refuses anyone not signed in', async () => {
    auth.getCurrentUser.mockResolvedValue(null);
    const access = await requireMember();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.response.status).toBe(401);
  });

  it('refuses staff the manager’s actions', async () => {
    queries.findMemberByUserId.mockResolvedValue(record('staff'));
    const access = await requireManager();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.response.status).toBe(403);
  });

  it('lets the manager through', async () => {
    queries.findMemberByUserId.mockResolvedValue(record('manager'));
    const access = await requireManager();
    expect(access.ok).toBe(true);
  });

  it('lets someone on a starting password do nothing but choose their own', async () => {
    queries.findMemberByUserId.mockResolvedValue({ ...record('staff'), mustChangePassword: true });
    const member = await requireMember();
    expect(member.ok).toBe(false);
    if (!member.ok) expect(member.response.status).toBe(403);
    expect((await requireStartingPassword()).ok).toBe(true);
  });

  it('will not change a password already chosen without the old one', async () => {
    queries.findMemberByUserId.mockResolvedValue(record('staff'));
    const access = await requireStartingPassword();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.response.status).toBe(403);
  });

  it('refuses an account that is not on the rota', async () => {
    queries.findMemberByUserId.mockResolvedValue(null);
    queries.hasManager.mockResolvedValue(true);
    const access = await requireMember();
    expect(access.ok).toBe(false);
    if (!access.ok) expect(access.response.status).toBe(403);
  });
});
