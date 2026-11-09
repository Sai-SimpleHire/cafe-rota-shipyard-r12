'use client';

import { DataTable } from '@/components/data_table/DataTable';
import { Status } from '@/components/ui_foundation/Status';

import { DecideSwapButtons } from './DecideSwapButtons';

export type SwapRow = {
  id: string;
  shift: string;
  from: string;
  to: string;
  asked: string;
  status: 'waiting' | 'approved' | 'declined';
};

function StatusChip({ status }: { status: SwapRow['status'] }) {
  if (status === 'approved') return <Status tone="ok" label="Approved" />;
  if (status === 'declined') return <Status tone="danger" label="Turned down" />;
  return <Status tone="warn" label="Waiting for you" />;
}

/** Every swap request, newest first, with the decision buttons on waiting rows only. */
export function SwapTable({ swaps }: { swaps: SwapRow[] }) {
  const rows = swaps.map((swap) => ({
    shift: swap.shift,
    from: swap.from,
    to: swap.to,
    asked: swap.asked,
    status: <StatusChip status={swap.status} />,
    decide:
      swap.status === 'waiting' ? (
        <DecideSwapButtons
          swapId={swap.id}
          description={`${swap.from} to ${swap.to}, ${swap.shift}`}
        />
      ) : null,
  }));

  return (
    <DataTable
      caption="Swap requests, newest first"
      rows={rows}
      columns={[
        { key: 'shift', label: 'Shift', sortable: false },
        { key: 'from', label: 'From' },
        { key: 'to', label: 'To' },
        { key: 'asked', label: 'Asked', sortable: false },
        { key: 'status', label: 'Status', sortable: false },
        { key: 'decide', label: 'Decide', sortable: false },
      ]}
    />
  );
}
