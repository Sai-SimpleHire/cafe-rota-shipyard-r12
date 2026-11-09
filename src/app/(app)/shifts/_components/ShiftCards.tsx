'use client';

import { useEffect, useState } from 'react';

import { Status } from '@/components/ui_foundation/Status';
import { dayLabel, timeRange } from '@/lib/rota/time';
import type { MyShift } from '@/lib/shifts/service';

import { AskSwapButton } from './AskSwapButton';

type Colleague = { id: string; name: string };

/** Today in this phone's own time zone, as YYYY-MM-DD. */
function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function SwapLine({ swap }: { swap: NonNullable<MyShift['swap']> }) {
  if (swap.status === 'waiting') {
    return <Status tone="warn" label={`Swap with ${swap.colleague} — waiting for the manager`} />;
  }
  if (swap.status === 'declined') {
    return <Status tone="danger" label={`Swap with ${swap.colleague} turned down`} />;
  }
  return null;
}

/** One card per shift, soonest first. Shifts before today on this phone are left off. */
export function ShiftCards({ shifts, colleagues }: { shifts: MyShift[]; colleagues: Colleague[] }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localToday()), []);

  const upcoming = today ? shifts.filter((shift) => shift.day >= today) : shifts;

  if (upcoming.length === 0) {
    return (
      <p className="rota-muted">
        No shifts coming up. When your manager publishes next week, your shifts appear here.
      </p>
    );
  }

  return (
    <ul className="rota-cards" aria-label="Your shifts">
      {upcoming.map((shift) => {
        const label = `${dayLabel(shift.day)}, ${timeRange(shift.startMinute, shift.endMinute)}`;
        const isWaiting = shift.swap?.status === 'waiting';
        return (
          <li key={shift.id} className="rota-card">
            <p className="rota-card-day">{dayLabel(shift.day)}</p>
            <p className="rota-card-time">{timeRange(shift.startMinute, shift.endMinute)}</p>
            {shift.swap ? <SwapLine swap={shift.swap} /> : null}
            {isWaiting ? null : (
              <div className="rota-actions">
                <AskSwapButton shiftId={shift.id} shiftLabel={label} colleagues={colleagues} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
