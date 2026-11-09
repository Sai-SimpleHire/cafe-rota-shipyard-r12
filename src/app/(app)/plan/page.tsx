import Link from 'next/link';

import { Status } from '@/components/ui_foundation/Status';
import { managerPage } from '@/lib/members/page-access';
import { loadWeekPlan } from '@/lib/rota/service';
import { addDays, dayLabel, isIsoDate, timeRange, toIsoDate, weekDays } from '@/lib/rota/time';

import { AddShiftForm } from './_components/AddShiftForm';
import { PublishButton } from './_components/PublishButton';
import { ShiftTable } from './_components/ShiftTable';

export const metadata = { title: 'Plan the week · Café rota' };

export default async function PlanWeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await managerPage();
  const { week } = await searchParams;
  const asked = week && isIsoDate(week) ? week : toIsoDate(new Date());
  const plan = await loadWeekPlan(asked);

  const days = weekDays(plan.monday).map((day) => ({ value: day, label: dayLabel(day) }));
  const people = plan.people.map((person) => ({ value: person.id, label: person.name }));
  const shifts = plan.shifts.map((shift) => ({
    id: shift.id,
    day: dayLabel(shift.day),
    time: timeRange(shift.startMinute, shift.endMinute),
    who: plan.names.get(shift.memberId) ?? 'Unknown',
    isMemberGone: shift.isMemberGone,
  }));

  return (
    <>
      <div className="rota-title">
        <h1>Week of {dayLabel(plan.monday)}</h1>
        {plan.isPublished ? (
          <Status tone="ok" label="Published" />
        ) : (
          <Status tone="warn" label="Draft" />
        )}
      </div>

      <div className="rota-row">
        <Link className="ui-button ui-button-quiet" href={`/plan?week=${addDays(plan.monday, -7)}`}>
          ← Previous week
        </Link>
        <Link className="ui-button ui-button-quiet" href={`/plan?week=${addDays(plan.monday, 7)}`}>
          Next week →
        </Link>
        {plan.isPublished ? (
          <span className="rota-muted">Published — staff can see this week.</span>
        ) : (
          <PublishButton week={plan.monday} />
        )}
      </div>

      <section className="rota-panel" aria-labelledby="add-shift-heading">
        <h2 id="add-shift-heading">Add a shift</h2>
        <AddShiftForm days={days} people={people} />
      </section>

      {shifts.length === 0 ? (
        <p className="rota-muted">
          No shifts this week yet. Add the first one above — staff will not see anything until you
          publish.
        </p>
      ) : (
        <ShiftTable shifts={shifts} />
      )}
    </>
  );
}
