'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Dialog } from '@/components/ui_blocks/Dialog';
import { Button } from '@/components/ui_foundation/Button';
import { send } from '@/lib/ui/send';

/** Removing someone is asked once more in a dialog, because it stops their sign-in. */
export function RemoveStaffButton({ memberId, name }: { memberId: string; name: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = useCallback(() => setIsOpen(false), []);

  async function remove() {
    setIsBusy(true);
    const result = await send(`/api/staff/${memberId}`, 'DELETE');
    setIsBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button tone="quiet" onClick={() => setIsOpen(true)} aria-label={`Remove ${name}`}>
        Remove
      </Button>
      {isOpen ? (
        <Dialog
          kind="confirm"
          title={`Remove ${name} from the café?`}
          onClose={close}
          actions={
            <>
              <Button tone="danger" busy={isBusy} onClick={remove}>
                Remove {name}
              </Button>
              <Button tone="quiet" onClick={close}>
                Cancel
              </Button>
            </>
          }
        >
          <p>
            They will not be able to sign in. Their shifts stay on the rota for you to reassign.
          </p>
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
