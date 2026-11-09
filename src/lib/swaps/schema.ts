import { z } from 'zod';

import { field } from '@/seams/validate';

/** A staff member asking a named colleague to take one of their shifts. */
export const askSwapSchema = z.object({
  shiftId: field.id(),
  toMemberId: z.string().min(1, 'Please choose who should take it.'),
});

export type AskSwap = z.infer<typeof askSwapSchema>;

/** The manager's answer. */
export const swapDecisionSchema = z.object({
  decision: z.enum(['approve', 'decline'], 'Please approve or turn it down.'),
});
