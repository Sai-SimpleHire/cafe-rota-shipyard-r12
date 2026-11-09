import { checkPassword, hashPassword, normaliseEmail } from '@/components/auth/password';
import { revokeAllSessions } from '@/components/auth/session';

import {
  createStaffAccount,
  findAccountByEmail,
  findMember,
  listCurrentStaff,
  markRemoved,
  rejoinAsStaff,
  type StaffRecord,
} from './queries';
import type { NewStaff } from './schema';

export type Outcome = { ok: true } | { ok: false; message: string; status: number };

/** The staff list, manager first, then by name. */
export async function loadStaff(): Promise<StaffRecord[]> {
  const staff = await listCurrentStaff();
  return staff.sort((a, b) => {
    if (a.role !== b.role) return a.role === 'manager' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * The manager adds someone with a starting password, which they hand over in
 * person; the staff member is asked to choose their own at first sign-in.
 */
export async function addStaff(input: NewStaff): Promise<Outcome> {
  const email = normaliseEmail(input.email);
  const check = checkPassword(input.password, { email });
  if (!check.ok) {
    const message = `Starting password: ${check.issues[0] ?? 'please choose another.'}`;
    return { ok: false, message, status: 400 };
  }

  const existing = await findAccountByEmail(email);
  if (existing?.member && !existing.member.removedAt) {
    return { ok: false, message: 'That email address is already on the staff list.', status: 409 };
  }

  const passwordHash = await hashPassword(input.password);
  if (existing) {
    await rejoinAsStaff({ userId: existing.userId, name: input.name, passwordHash });
    await revokeAllSessions(existing.userId);
    return { ok: true };
  }
  await createStaffAccount({ name: input.name, email, passwordHash });
  return { ok: true };
}

export async function removeStaff(input: {
  memberId: string;
  managerId: string;
}): Promise<Outcome> {
  const member = await findMember(input.memberId);
  if (!member || member.removedAt) {
    return { ok: false, message: 'That person is no longer on the staff list.', status: 404 };
  }
  // The café always needs its manager, so the manager cannot be removed here.
  if (member.role === 'manager' || member.id === input.managerId) {
    return { ok: false, message: 'The manager cannot be removed.', status: 400 };
  }
  await markRemoved({ memberId: member.id, userId: member.userId });
  await revokeAllSessions(member.userId);
  return { ok: true };
}
