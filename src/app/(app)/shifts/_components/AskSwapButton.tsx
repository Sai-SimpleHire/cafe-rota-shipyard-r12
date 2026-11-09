'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Dialog } from '@/components/ui_blocks/Dialog';
import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/ui/send';

type Colleague = { id: string; name: string };

/** Asks the manager to give this shift to a named colleague. */
export function AskSwapButton({
  shiftId,
  shiftLabel,
  colleagues,
}: {
  shiftId: string;
  shiftLabel: string;
  colleagues: Colleague[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colleagueId, setColleagueId] = useState(colleagues[0]?.id ?? '');
  const close = useCallback(() => setIsOpen(false), []);
  const selectId = `swap-to-${shiftId}`;

  async function ask() {
    setIsBusy(true);
    const result = await send('/api/swaps', 'POST', { shiftId, toMemberId: colleagueId });
    setIsBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setIsOpen(false);
    router.refresh();
  }

  if (colleagues.length === 0) return null;

  return (
    <>
      <Button tone="quiet" onClick={() => setIsOpen(true)} aria-label={`Ask to swap ${shiftLabel}`}>
        Ask to swap
      </Button>
      {isOpen ? (
        <Dialog
          kind="form"
          title={`Swap ${shiftLabel}`}
          onClose={close}
          actions={
            <>
              <Button tone="primary" busy={isBusy} onClick={ask}>
                Send to the manager
              </Button>
              <Button tone="quiet" onClick={close}>
                Cancel
              </Button>
            </>
          }
        >
          <div className="rota-field">
            <label htmlFor={selectId}>Who should take it?</label>
            <select
              id={selectId}
              value={colleagueId}
              onChange={(event) => setColleagueId(event.target.value)}
            >
              {colleagues.map((colleague) => (
                <option key={colleague.id} value={colleague.id}>
                  {colleague.name}
                </option>
              ))}
            </select>
          </div>
          <p className="rota-hint">The shift stays yours until the manager approves.</p>
          {error ? (
            <p className="rota-error" role="alert">
              {error}
            </p>
          ) : null}
        </Dialog>
      ) : null}
    </>
  );
}
