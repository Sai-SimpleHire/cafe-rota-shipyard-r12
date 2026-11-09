import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/seams/auth';
import { resolveMember } from '@/lib/members/service';

/** The front door: sign in, then the manager's plan or the staff member's own shifts. */
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const member = await resolveMember(user.id);
  if (member?.mustChangePassword) redirect('/change-password');
  redirect(member?.role === 'manager' ? '/plan' : '/shifts');
}
