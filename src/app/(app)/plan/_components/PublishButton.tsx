'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/ui/send';

/** Lets staff see the week. The only primary action on the screen. */
export function PublishButton({ week }: { week: string }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setIsBusy(true);
    const result = await send('/api/weeks/publish', 'POST', { week });
    setIsBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    router.refresh();
  }

  return (
    <span className="rota-actions">
      <Button tone="primary" busy={isBusy} onClick={publish}>
        Publish this week
      </Button>
      {error ? (
        <span className="rota-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
