import { z } from 'zod';

/** Choosing your own password. The strength rules are checked on the server by auth. */
export const newPasswordSchema = z
  .object({
    password: z.string().min(1, 'Please choose a password.'),
    confirm: z.string().min(1, 'Please type it again.'),
  })
  .refine((input) => input.password === input.confirm, {
    message: 'Those two do not match.',
    path: ['confirm'],
  });
