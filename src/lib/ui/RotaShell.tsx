'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/ui_blocks/AppShell';
import type { NavItem } from '@/components/ui_blocks/blocks';

import { SignOutButton } from './SignOutButton';

const managerNav: NavItem[] = [
  { href: '/plan', label: 'Plan the week' },
  { href: '/staff', label: 'Staff' },
  { href: '/swaps', label: 'Swap requests' },
  { href: '/shifts', label: 'My shifts' },
];

const staffNav: NavItem[] = [{ href: '/shifts', label: 'My shifts' }];

/** The frame: the café's name and sign out on top, then the links this person may use. */
export function RotaShell({
  isManager,
  name,
  children,
}: {
  isManager: boolean;
  name: string;
  children: ReactNode;
}) {
  const path = usePathname();
  return (
    <div className="rota-frame">
      <header className="rota-bar">
        <span className="rota-brand">Café rota</span>
        <span className="rota-who">{name}</span>
        <SignOutButton />
      </header>
      <AppShell items={isManager ? managerNav : staffNav} path={path}>
        <div className="rota-page">{children}</div>
      </AppShell>
    </div>
  );
}
