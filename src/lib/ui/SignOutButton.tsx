'use client';

import { useState } from 'react';

import { Button } from '@/components/ui_foundation/Button';

/** Ends this session on the server, then goes to the sign-in screen. */
export function SignOutButton() {
  const [isBusy, setIsBusy] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  async function signOut() {
    setIsBusy(true);
    setHasFailed(false);
    const response = await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    if (!response || !response.ok) {
      setIsBusy(false);
      setHasFailed(true);
      return;
    }
    window.location.assign('/sign-in');
  }

  return (
    <span className="rota-signout">
      {hasFailed ? <span role="alert">Could not sign out. Try again.</span> : null}
      <Button tone="quiet" busy={isBusy} onClick={signOut}>
        Sign out
      </Button>
    </span>
  );
}
