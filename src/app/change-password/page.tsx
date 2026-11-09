import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/seams/auth';
import { resolveMember } from '@/lib/members/service';

import { ChangePasswordForm } from './ChangePasswordForm';

import '@/lib/ui/rota.css';

export const metadata = { title: 'Choose your password · Café rota' };

/** Shown once, straight after a staff member's first sign-in. */
export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const member = await resolveMember(user.id);
  if (!member?.mustChangePassword) redirect('/');

  return (
    <main className="rota-page rota-alone">
      <h1>Choose your password</h1>
      <p className="rota-muted">
        Your manager set a starting password. Choose your own to carry on.
      </p>
      <ChangePasswordForm />
    </main>
  );
}
