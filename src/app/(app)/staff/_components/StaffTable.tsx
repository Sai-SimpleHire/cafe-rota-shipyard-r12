'use client';

import { DataTable } from '@/components/data_table/DataTable';
import { Status } from '@/components/ui_foundation/Status';

import { RemoveStaffButton } from './RemoveStaffButton';

export type StaffRow = {
  memberId: string;
  name: string;
  email: string;
  isManager: boolean;
  mustChangePassword: boolean;
};

/** Everyone on the rota. The manager has no Remove button. */
export function StaffTable({ staff }: { staff: StaffRow[] }) {
  const rows = staff.map((person) => ({
    name: person.name,
    email: person.email,
    role: person.isManager ? 'Manager' : 'Staff',
    status: person.mustChangePassword ? (
      <Status tone="warn" label="Waiting for first sign-in" />
    ) : (
      <Status tone="ok" label="Active" />
    ),
    remove: person.isManager ? null : (
      <RemoveStaffButton memberId={person.memberId} name={person.name} />
    ),
  }));

  return (
    <DataTable
      caption="Everyone on the rota"
      rows={rows}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status', sortable: false },
        { key: 'remove', label: 'Remove', sortable: false },
      ]}
    />
  );
}
