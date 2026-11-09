import { NextResponse, type NextRequest } from 'next/server';

import { getCurrentUser } from '@/seams/auth';
import { validateBody } from '@/seams/validate';
import { chooseOwnPassword } from '@/lib/account/service';
import { newPasswordSchema } from '@/lib/account/schema';
import { invalid } from '@/lib/http/reply';
import { requireStartingPassword } from '@/lib/members/access';

/** `POST /api/account/password` — a staff member replaces their starting password. */
export async function POST(request: NextRequest) {
  const access = await requireStartingPassword();
  if (!access.ok) return access.response;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const body = await validateBody(request, newPasswordSchema);
  if (!body.ok) return invalid(body);

  const outcome = await chooseOwnPassword({
    member: access.member,
    user,
    password: body.data.password,
  });
  if (!outcome.ok) return NextResponse.json({ error: outcome.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
