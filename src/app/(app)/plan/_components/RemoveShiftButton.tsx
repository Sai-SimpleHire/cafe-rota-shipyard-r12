'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/ui/send';

/** Takes one shift off the rota. Small and quiet: it sits at the end of a row. */
export function RemoveShiftButton({
  shiftId,
  description,
}: {
  shiftId: string;
  description: string;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setIsBusy(true);
    const result = await send(`/api/shifts/${shiftId}`, 'DELETE');
    setIsBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <span className="rota-actions">
      <Button tone="quiet" busy={isBusy} onClick={remove} aria-label={`Remove ${description}`}>
        Remove
      </Button>
      {error ? (
        <span className="rota-error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
