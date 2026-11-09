import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/seams/auth';

import { resolveMember, type Member } from './service';

/**
 * The one place a route asks "who is this, and may they?".
 *
 * The shape matches `requireUser()`: a caller has to handle the refusal, so a
 * forgotten `if` cannot let a request through.
 */
export type Access = { ok: true; member: Member } | { ok: false; response: NextResponse };

function refuse(message: string, status: number): Access {
  return { ok: false, response: NextResponse.json({ error: message }, { status }) };
}

async function signedInMember(): Promise<Access> {
  const user = await getCurrentUser();
  if (!user) return refuse('Please sign in.', 401);
  const member = await resolveMember(user.id);
  if (!member) return refuse('You are not on this café’s rota. Ask your manager.', 403);
  return { ok: true, member };
}

/** Anyone on the rota who has chosen their own password. */
export async function requireMember(): Promise<Access> {
  const access = await signedInMember();
  if (!access.ok) return access;
  // The starting password was shared in person, so it buys nothing but choosing a new one.
  if (access.member.mustChangePassword) return refuse('Choose your own password first.', 403);
  return access;
}

/**
 * Only someone still on the manager's starting password. Changing a password
 * any other time would need the old one, which this flow does not ask for.
 */
export async function requireStartingPassword(): Promise<Access> {
  const access = await signedInMember();
  if (!access.ok) return access;
  if (!access.member.mustChangePassword) {
    return refuse('Your password has already been chosen.', 403);
  }
  return access;
}

export async function requireManager(): Promise<Access> {
  const access = await requireMember();
  if (!access.ok) return access;
  if (access.member.role !== 'manager') return refuse('Only the manager can do that.', 403);
  return access;
}
