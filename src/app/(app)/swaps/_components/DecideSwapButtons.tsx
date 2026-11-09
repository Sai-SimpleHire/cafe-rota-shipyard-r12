'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/ui/send';

type Decision = 'approve' | 'decline';

/** Approve moves the shift to the colleague; Turn down leaves the rota as it is. */
export function DecideSwapButtons({
  swapId,
  description,
}: {
  swapId: string;
  description: string;
}) {
  const router = useRouter();
  const [busyWith, setBusyWith] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: Decision) {
    setBusyWith(decision);
    const result = await send(`/api/swaps/${swapId}/decision`, 'POST', { decision });
    setBusyWith(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <span className="rota-actions">
      <Button
        tone="primary"
        busy={busyWith === 'approve'}
        onClick={() => decide('approve')}
        aria-label={`Approve ${description}`}
      >
        Approve
      </Button>
      <Button
        tone="quiet"
        busy={busyWith === 'decline'}
        onClick={() => decide('decline')}
        aria-label={`Turn down ${description}`}
      >
        Turn down
      </Button>
      {error ? (
        <span className="rota-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
