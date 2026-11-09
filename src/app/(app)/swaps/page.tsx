import { managerPage } from '@/lib/members/page-access';
import { dayLabel, timeRange, toIsoDate } from '@/lib/rota/time';
import { loadSwapRequests } from '@/lib/swaps/service';

import { SwapTable } from './_components/SwapTable';

export const metadata = { title: 'Swap requests · Café rota' };

export default async function SwapRequestsPage() {
  await managerPage();
  const swaps = await loadSwapRequests();

  const rows = swaps.map((swap) => ({
    id: swap.id,
    shift: [dayLabel(swap.shift.day), timeRange(swap.shift.startMinute, swap.shift.endMinute)].join(
      ', ',
    ),
    from: swap.fromName,
    to: swap.toName,
    asked: dayLabel(toIsoDate(swap.createdAt)),
    status: swap.status,
  }));
  const waiting = rows.filter((row) => row.status === 'waiting').length;

  return (
    <>
      <div className="rota-title">
        <h1>Swap requests</h1>
        {waiting > 0 ? <span className="rota-muted">{waiting} waiting for you</span> : null}
      </div>
      {rows.length === 0 ? (
        <p className="rota-muted">
          No swap requests. When someone asks to swap a shift it appears here for you to decide.
        </p>
      ) : (
        <SwapTable swaps={rows} />
      )}
    </>
  );
}
