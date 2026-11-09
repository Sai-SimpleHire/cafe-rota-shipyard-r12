import { checkPassword, hashPassword } from '@/components/auth/password';
import { createSession, revokeAllSessions } from '@/components/auth/session';
import { clearMustChangePassword, setPasswordHash } from '@/lib/members/queries';
import type { Member } from '@/lib/members/service';

export type PasswordOutcome = { ok: true } | { ok: false; message: string };

/**
 * Replace the starting password the manager gave out with one only this
 * person knows. Every other session ends, so the starting password stops
 * being any use, and this browser gets a fresh session to stay signed in.
 */
export async function chooseOwnPassword(input: {
  member: Member;
  user: { email: string; name: string | null };
  password: string;
}): Promise<PasswordOutcome> {
  const check = checkPassword(input.password, {
    email: input.user.email,
    name: input.user.name ?? undefined,
  });
  if (!check.ok) return { ok: false, message: check.issues[0] ?? 'Please choose another.' };

  await setPasswordHash(input.member.userId, await hashPassword(input.password));
  await clearMustChangePassword(input.member.id);
  await revokeAllSessions(input.member.userId);
  await createSession(input.member.userId);
  return { ok: true };
}
