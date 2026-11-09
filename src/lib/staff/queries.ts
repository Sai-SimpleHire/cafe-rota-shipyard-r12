import { prisma } from '@/lib/prisma';

/** Database reads and writes for the staff list. One café, so nothing to scope by. */

export interface StaffRecord {
  memberId: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

export async function listCurrentStaff(): Promise<StaffRecord[]> {
  const members = await prisma.cafeMember.findMany({
    where: { removedAt: null },
    select: { id: true, userId: true, role: true, mustChangePassword: true },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: members.map((member) => member.userId) } },
    select: { id: true, name: true, email: true },
  });
  const userById = new Map(users.map((user) => [user.id, user]));
  return members.map((member) => {
    const user = userById.get(member.userId);
    return {
      memberId: member.id,
      name: user?.name ?? user?.email ?? 'Unknown',
      email: user?.email ?? '',
      role: member.role,
      mustChangePassword: member.mustChangePassword,
    };
  });
}

export interface AccountRecord {
  userId: string;
  member: { id: string; removedAt: Date | null } | null;
}

export async function findAccountByEmail(email: string): Promise<AccountRecord | null> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return null;
  const member = await prisma.cafeMember.findUnique({
    where: { userId: user.id },
    select: { id: true, removedAt: true },
  });
  return { userId: user.id, member };
}

export async function createStaffAccount(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: input, select: { id: true } });
    await tx.cafeMember.create({
      data: { userId: user.id, role: 'staff', mustChangePassword: true },
    });
  });
}

/** Someone with an account already (they left, or signed themselves up) joins the staff. */
export async function rejoinAsStaff(input: {
  userId: string;
  name: string;
  passwordHash: string;
}): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: { name: input.name, passwordHash: input.passwordHash, disabledAt: null },
    }),
    prisma.cafeMember.upsert({
      where: { userId: input.userId },
      create: { userId: input.userId, role: 'staff', mustChangePassword: true },
      update: { role: 'staff', mustChangePassword: true, removedAt: null },
    }),
  ]);
}

export function findMember(memberId: string) {
  return prisma.cafeMember.findUnique({
    where: { id: memberId },
    select: { id: true, userId: true, role: true, removedAt: true },
  });
}

/**
 * Take someone off the staff. Their sign-in stops working at once, and swap
 * requests waiting on them are turned down, since nobody can now act on them.
 * Their shifts stay, marked as theirs, for the manager to reassign.
 */
export async function markRemoved(input: { memberId: string; userId: string }): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.cafeMember.update({ where: { id: input.memberId }, data: { removedAt: now } }),
    prisma.user.update({ where: { id: input.userId }, data: { disabledAt: now } }),
    prisma.swapRequest.updateMany({
      where: {
        status: 'waiting',
        OR: [{ fromMemberId: input.memberId }, { toMemberId: input.memberId }],
      },
      data: { status: 'declined', decidedAt: now },
    }),
  ]);
}
