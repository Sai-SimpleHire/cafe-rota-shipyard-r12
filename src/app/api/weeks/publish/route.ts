import type { NextRequest } from 'next/server';

import { validateBody } from '@/seams/validate';
import { fromOutcome, invalid } from '@/lib/http/reply';
import { requireManager } from '@/lib/members/access';
import { publishWeekSchema } from '@/lib/rota/schema';
import { publishWeek } from '@/lib/rota/service';

/** `POST /api/weeks/publish` — the manager lets staff see a week. */
export async function POST(request: NextRequest) {
  const access = await requireManager();
  if (!access.ok) return access.response;

  const body = await validateBody(request, publishWeekSchema);
  if (!body.ok) return invalid(body);

  return fromOutcome(await publishWeek(body.data.week));
}
