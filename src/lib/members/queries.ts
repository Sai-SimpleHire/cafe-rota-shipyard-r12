import { prisma } from '@/lib/prisma';

/**
 * Database reads and writes for the people on the rota.
 *
 * One café only (multiple cafés are out of scope in IDEA.md), so there is no
 * organisation to scope by and these use the single client directly.
 */

export interface MemberRecord {
  id: string;
  userId: string;
  role: string;
  mustChangePassword: boolean;
  removedAt: Date | null;
}

const memberFields = {
  id: true,
  userId: true,
  role: true,
  mustChangePassword: true,
  removedAt: true,
} as const;

export function findMemberByUserId(userId: string): Promise<MemberRecord | null> {
  return prisma.cafeMember.findUnique({ where: { userId }, select: memberFields });
}

export async function hasManager(): Promise<boolean> {
  const count = await prisma.cafeMember.count({ where: { role: 'manager', removedAt: null } });
  return count > 0;
}

export function createManager(userId: string): Promise<MemberRecord> {
  // Upsert: two first page loads at once must not both try to create the row.
  return prisma.cafeMember.upsert({
    where: { userId },
    create: { userId, role: 'manager' },
    update: {},
    select: memberFields,
  });
}

export async function clearMustChangePassword(memberId: string): Promise<void> {
  await prisma.cafeMember.update({
    where: { id: memberId },
    data: { mustChangePassword: false },
  });
}

export async function setPasswordHash(userId: string, passwordHash: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export interface ColleagueRecord {
  id: string;
  name: string;
}

/** Everyone still on the rota, by name. */
export async function listActiveMembers(): Promise<ColleagueRecord[]> {
  const members = await prisma.cafeMember.findMany({
    where: { removedAt: null },
    select: { id: true },
  });
  const names = await namesForMembers(members.map((member) => member.id));
  return members
    .map((member) => ({ id: member.id, name: names.get(member.id) ?? 'Unknown' }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Names for these members, including anyone who has left. Falls back to their email. */
export async function namesForMembers(memberIds: string[]): Promise<Map<string, string>> {
  const members = await prisma.cafeMember.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, userId: true },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: members.map((member) => member.userId) } },
    select: { id: true, name: true, email: true },
  });
  const nameOfUser = new Map(users.map((user) => [user.id, user.name ?? user.email]));
  return new Map(members.map((member) => [member.id, nameOfUser.get(member.userId) ?? 'Unknown']));
}
