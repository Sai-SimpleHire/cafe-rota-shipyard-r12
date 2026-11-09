import { redirect } from 'next/navigation';
import { cache } from 'react';

import { getCurrentUser } from '@/seams/auth';

import { resolveMember, type Member } from './service';

export interface PageViewer {
  member: Member | null;
  name: string;
}

/**
 * Who is looking at a screen. Not signed in goes to sign-in; a starting
 * password must be changed before anything else. Cached per request so the
 * layout and the page ask the database once.
 */
export const viewPage = cache(async (): Promise<PageViewer> => {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const member = await resolveMember(user.id);
  if (member?.mustChangePassword) redirect('/change-password');
  return { member, name: user.name ?? user.email };
});

/** For screens anyone on the rota may see. */
export async function memberPage(): Promise<Member> {
  const { member } = await viewPage();
  if (!member) redirect('/');
  return member;
}

/** For the manager's screens. Staff are sent to their own shifts. */
export async function managerPage(): Promise<Member> {
  const member = await memberPage();
  if (member.role !== 'manager') redirect('/shifts');
  return member;
}
