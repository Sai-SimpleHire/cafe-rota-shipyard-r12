import { NextResponse } from 'next/server';

import type { Invalid } from '@/seams/validate';

/** The replies every rota route sends, so the wording stays the same everywhere. */

export function invalid(result: Invalid): NextResponse {
  return NextResponse.json(
    { error: result.message, fieldErrors: result.fieldErrors },
    { status: 400 },
  );
}

export function fromOutcome(
  outcome: { ok: true } | { ok: false; message: string; status: number },
): NextResponse {
  if (outcome.ok) return NextResponse.json({ ok: true });
  return NextResponse.json({ error: outcome.message }, { status: outcome.status });
}
