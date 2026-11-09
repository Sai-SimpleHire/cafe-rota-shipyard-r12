import { managerPage } from '@/lib/members/page-access';
import { loadStaff } from '@/lib/staff/service';

import { AddStaffForm } from './_components/AddStaffForm';
import { StaffTable } from './_components/StaffTable';

export const metadata = { title: 'Staff · Café rota' };

export default async function StaffPage() {
  await managerPage();
  const staff = await loadStaff();
  const rows = staff.map((person) => ({
    memberId: person.memberId,
    name: person.name,
    email: person.email,
    isManager: person.role === 'manager',
    mustChangePassword: person.mustChangePassword,
  }));

  return (
    <>
      <div className="rota-title">
        <h1>Staff</h1>
      </div>

      <section className="rota-panel" aria-labelledby="add-staff-heading">
        <h2 id="add-staff-heading">Add a staff member</h2>
        <AddStaffForm />
      </section>

      {rows.length <= 1 ? (
        <p className="rota-muted">Nobody here yet but you. Add your first staff member above.</p>
      ) : null}
      <StaffTable staff={rows} />
    </>
  );
}
