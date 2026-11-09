'use client';

import { useState, type FormEvent } from 'react';

import { buttonProps } from '@/components/ui_foundation/primitives';
import { validate } from '@/seams/validate';
import { newPasswordSchema } from '@/lib/account/schema';
import { send } from '@/lib/ui/send';

/** New password, typed twice, then on to the rota. */
export function ChangePasswordForm() {
  const [isBusy, setIsBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const checked = validate(newPasswordSchema, values);
    if (!checked.ok) {
      setErrors(checked.fieldErrors);
      return;
    }
    setIsBusy(true);
    const result = await send('/api/account/password', 'POST', checked.data);
    if (!result.ok) {
      setIsBusy(false);
      setErrors({ password: result.message });
      return;
    }
    window.location.assign('/');
  }

  return (
    <form className="rota-form-stack" onSubmit={save} noValidate>
      <div className="rota-field">
        <label htmlFor="new-password">New password</label>
        <p className="rota-hint" id="new-password-hint">
          At least 12 characters, mixing three of: small letters, capitals, numbers, symbols.
        </p>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-describedby="new-password-hint"
          aria-invalid={errors.password ? true : undefined}
        />
        {errors.password ? <p className="rota-error">{errors.password}</p> : null}
      </div>
      <div className="rota-field">
        <label htmlFor="confirm-password">Type it again</label>
        <input
          id="confirm-password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={errors.confirm ? true : undefined}
        />
        {errors.confirm ? <p className="rota-error">{errors.confirm}</p> : null}
      </div>
      <button {...buttonProps({ tone: 'primary', busy: isBusy })} type="submit">
        Save my password
      </button>
    </form>
  );
}
