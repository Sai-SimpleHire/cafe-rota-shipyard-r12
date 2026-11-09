import type { NextRequest } from 'next/server';

import { validateBody } from '@/seams/validate';
import { fromOutcome, invalid } from '@/lib/http/reply';
import { requireManager } from '@/lib/members/access';
import { newShiftSchema } from '@/lib/rota/schema';
import { addShift } from '@/lib/rota/service';

/** `POST /api/shifts` — the manager adds a shift to a week. */
export async function POST(request: NextRequest) {
  const access = await requireManager();
  if (!access.ok) return access.response;

  const body = await validateBody(request, newShiftSchema);
  if (!body.ok) return invalid(body);

  return fromOutcome(await addShift(body.data));
}
