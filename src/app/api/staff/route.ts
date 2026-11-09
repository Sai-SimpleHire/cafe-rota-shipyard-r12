import type { NextRequest } from 'next/server';

import { validateBody } from '@/seams/validate';
import { fromOutcome, invalid } from '@/lib/http/reply';
import { requireManager } from '@/lib/members/access';
import { newStaffSchema } from '@/lib/staff/schema';
import { addStaff } from '@/lib/staff/service';

/** `POST /api/staff` — the manager adds a staff member with a starting password. */
export async function POST(request: NextRequest) {
  const access = await requireManager();
  if (!access.ok) return access.response;

  const body = await validateBody(request, newStaffSchema);
  if (!body.ok) return invalid(body);

  return fromOutcome(await addStaff(body.data));
}
