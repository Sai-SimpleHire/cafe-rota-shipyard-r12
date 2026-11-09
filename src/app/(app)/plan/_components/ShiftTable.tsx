'use client';

import { DataTable } from '@/components/data_table/DataTable';
import { Status } from '@/components/ui_foundation/Status';

import { RemoveShiftButton } from './RemoveShiftButton';

export type PlannedShift = {
  id: string;
  day: string;
  time: string;
  who: string;
  isMemberGone: boolean;
};

/** The week's shifts, in day and time order, one line each. */
export function ShiftTable({ shifts }: { shifts: PlannedShift[] }) {
  const rows = shifts.map((shift) => ({
    day: shift.day,
    time: shift.time,
    who: shift.isMemberGone ? (
      <span>
        {shift.who} <Status tone="danger" label="Left" />
      </span>
    ) : (
      shift.who
    ),
    remove: (
      <RemoveShiftButton
        shiftId={shift.id}
        description={`${shift.who}, ${shift.day} ${shift.time}`}
      />
    ),
  }));

  return (
    <DataTable
      caption="Shifts this week"
      rows={rows}
      searchable={false}
      pageSize={100}
      columns={[
        { key: 'day', label: 'Day', sortable: false },
        { key: 'time', label: 'Time', sortable: false },
        { key: 'who', label: 'Who', sortable: false },
        { key: 'remove', label: 'Remove', sortable: false },
      ]}
    />
  );
}
