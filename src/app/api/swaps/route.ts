import type { NextRequest } from 'next/server';

import { validateBody } from '@/seams/validate';
import { fromOutcome, invalid } from '@/lib/http/reply';
import { requireMember } from '@/lib/members/access';
import { askSwapSchema } from '@/lib/swaps/schema';
import { askForSwap } from '@/lib/swaps/service';

/** `POST /api/swaps` — a staff member asks for a colleague to take one of their shifts. */
export async function POST(request: NextRequest) {
  const access = await requireMember();
  if (!access.ok) return access.response;

  const body = await validateBody(request, askSwapSchema);
  if (!body.ok) return invalid(body);

  return fromOutcome(await askForSwap({ ...body.data, memberId: access.member.id }));
}
