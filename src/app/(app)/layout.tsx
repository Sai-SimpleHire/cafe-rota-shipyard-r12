import type { ReactNode } from 'react';

import { viewPage } from '@/lib/members/page-access';
import { RotaShell } from '@/lib/ui/RotaShell';
import { SignOutButton } from '@/lib/ui/SignOutButton';

import '@/lib/ui/rota.css';

export default async function RotaLayout({ children }: { children: ReactNode }) {
  const { member, name } = await viewPage();

  if (!member) {
    return (
      <main className="rota-page rota-alone">
        <h1>You are not on the rota yet</h1>
        <p>
          This account is not on this café’s staff list. Ask your manager to add you; they will give
          you a starting password.
        </p>
        <SignOutButton />
      </main>
    );
  }

  return (
    <RotaShell isManager={member.role === 'manager'} name={name}>
      {children}
    </RotaShell>
  );
}
