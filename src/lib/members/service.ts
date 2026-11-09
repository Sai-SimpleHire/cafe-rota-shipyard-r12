import { hasManager, createManager, findMemberByUserId, type MemberRecord } from './queries';

export type Role = 'manager' | 'staff';

export interface Member {
  id: string;
  userId: string;
  role: Role;
  mustChangePassword: boolean;
}

function toMember(record: MemberRecord): Member | null {
  if (record.removedAt) return null;
  const role: Role = record.role === 'manager' ? 'manager' : 'staff';
  return {
    id: record.id,
    userId: record.userId,
    role,
    mustChangePassword: record.mustChangePassword,
  };
}

/**
 * The rota member behind a signed-in account, or null when they have no place
 * on it (never added, or removed).
 *
 * The very first account made becomes the manager: the café has nobody else
 * to set it up, and every later account is created by that manager.
 */
export async function resolveMember(userId: string): Promise<Member | null> {
  const existing = await findMemberByUserId(userId);
  if (existing) return toMember(existing);
  if (await hasManager()) return null;
  return toMember(await createManager(userId));
}

export function isManager(member: Member): boolean {
  return member.role === 'manager';
}
