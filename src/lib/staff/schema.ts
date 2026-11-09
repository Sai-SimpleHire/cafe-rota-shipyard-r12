import { z } from 'zod';

import { field } from '@/seams/validate';

/** A new staff member, as the manager types them. Shared by the form and the route. */
export const newStaffSchema = z.object({
  name: field.requiredText('their name').pipe(z.string().max(120, 'That name is too long.')),
  email: field.email(),
  password: z.string().min(1, 'Please give them a starting password.'),
});

export type NewStaff = z.infer<typeof newStaffSchema>;
