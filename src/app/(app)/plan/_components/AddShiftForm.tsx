'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { buttonProps } from '@/components/ui_foundation/primitives';
import { validate } from '@/seams/validate';
import { newShiftSchema } from '@/lib/rota/schema';
import { send } from '@/lib/ui/send';

type Option = { value: string; label: string };

/** The manager's add-shift form, one line on a laptop and stacked on a phone. */
export function AddShiftForm({ days, people }: { days: Option[]; people: Option[] }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const checked = validate(newShiftSchema, values);
    if (!checked.ok) {
      setError(checked.message);
      return;
    }
    setIsBusy(true);
    const result = await send('/api/shifts', 'POST', checked.data);
    setIsBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    router.refresh();
  }

  if (people.length === 0) {
    return <p className="rota-muted">Add your staff first, then give them shifts here.</p>;
  }

  return (
    <form className="rota-form" onSubmit={addShift} noValidate>
      <div className="rota-field">
        <label htmlFor="shift-day">Day</label>
        <select id="shift-day" name="day" defaultValue={days[0]?.value}>
          {days.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>
      <div className="rota-field">
        <label htmlFor="shift-starts">Starts</label>
        <input id="shift-starts" name="starts" type="time" defaultValue="09:00" required />
      </div>
      <div className="rota-field">
        <label htmlFor="shift-ends">Ends</label>
        <input id="shift-ends" name="ends" type="time" defaultValue="15:00" required />
      </div>
      <div className="rota-field">
        <label htmlFor="shift-who">Who</label>
        <select id="shift-who" name="memberId" defaultValue={people[0]?.value}>
          {people.map((person) => (
            <option key={person.value} value={person.value}>
              {person.label}
            </option>
          ))}
        </select>
      </div>
      <button {...buttonProps({ tone: 'primary', busy: isBusy })} type="submit">
        {isBusy ? 'Adding…' : 'Add shift'}
      </button>
      {error ? (
        <p className="rota-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
