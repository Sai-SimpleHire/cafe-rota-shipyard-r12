import { z } from 'zod';

import { field } from '@/seams/validate';

import { isIsoDate, parseTime } from './time';

const isoDate = (label: string) => z.string().refine(isIsoDate, `Please choose ${label}.`);

const timeOfDay = (label: string) =>
  z.string().refine((text) => parseTime(text) !== null, `Please enter ${label}, like 09:00.`);

/** One shift, as the manager types it. Shared by the form and the route. */
export const newShiftSchema = z
  .object({
    day: isoDate('a day'),
    starts: timeOfDay('a start time'),
    ends: timeOfDay('an end time'),
    memberId: field.id(),
  })
  .refine((shift) => (parseTime(shift.ends) ?? 0) > (parseTime(shift.starts) ?? 0), {
    message: 'The shift has to end after it starts.',
    path: ['ends'],
  });

export type NewShift = z.infer<typeof newShiftSchema>;

export const publishWeekSchema = z.object({ week: isoDate('a week') });
