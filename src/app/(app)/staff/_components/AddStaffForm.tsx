'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { buttonProps } from '@/components/ui_foundation/primitives';
import { validate } from '@/seams/validate';
import { newStaffSchema } from '@/lib/staff/schema';
import { send } from '@/lib/ui/send';

/** Name, email and a starting password the manager hands over in person. */
export function AddStaffForm() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<string | null>(null);

  async function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const checked = validate(newStaffSchema, Object.fromEntries(new FormData(form).entries()));
    if (!checked.ok) {
      setErrors(checked.fieldErrors);
      return;
    }
    setIsBusy(true);
    const result = await send('/api/staff', 'POST', checked.data);
    setIsBusy(false);
    if (!result.ok) {
      setErrors({ _: result.message });
      return;
    }
    setErrors({});
    setAdded(checked.data.name);
    form.reset();
    router.refresh();
  }

  const fieldError = (name: string) =>
    errors[name] ? <p className="rota-error">{errors[name]}</p> : null;

  return (
    <form className="rota-form" onSubmit={addStaff} noValidate>
      <div className="rota-field">
        <label htmlFor="staff-name">Name</label>
        <input id="staff-name" name="name" autoComplete="off" maxLength={120} />
        {fieldError('name')}
      </div>
      <div className="rota-field">
        <label htmlFor="staff-email">Email address</label>
        <input id="staff-email" name="email" type="email" autoComplete="off" />
        {fieldError('email')}
      </div>
      <div className="rota-field">
        <label htmlFor="staff-password">Starting password</label>
        <input
          id="staff-password"
          name="password"
          type="text"
          autoComplete="off"
          aria-describedby="staff-password-hint"
        />
        {fieldError('password')}
      </div>
      <button {...buttonProps({ tone: 'primary', busy: isBusy })} type="submit">
        Add to staff
      </button>
      <p className="rota-hint" id="staff-password-hint">
        Give them this in person. They choose their own when they first sign in. At least 12
        characters, mixing three of: small letters, capitals, numbers, symbols.
      </p>
      {errors._ ? (
        <p className="rota-error" role="alert">
          {errors._}
        </p>
      ) : null}
      {added ? (
        <p role="status" className="rota-muted">
          {added} is on the staff list. They can sign in with the starting password now.
        </p>
      ) : null}
    </form>
  );
}
