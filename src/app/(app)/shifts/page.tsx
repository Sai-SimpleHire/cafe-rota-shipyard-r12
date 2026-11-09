import { memberPage } from '@/lib/members/page-access';
import { loadMyShiftsView } from '@/lib/shifts/service';

import { ShiftCards } from './_components/ShiftCards';

export const metadata = { title: 'My shifts · Café rota' };

/** A person's own shifts, from published weeks only, soonest first. */
export default async function MyShiftsPage() {
  const member = await memberPage();
  const view = await loadMyShiftsView(member.id, new Date());

  return (
    <>
      <div className="rota-title">
        <h1>My shifts</h1>
      </div>
      <ShiftCards shifts={view.shifts} colleagues={view.colleagues} />
    </>
  );
}
