/**
 * Send a change to the server and say plainly how it went.
 * A failure always comes back as a sentence, never as a silent success.
 */
export type SendResult = { ok: true } | { ok: false; message: string };

export async function send(url: string, method: string, body?: unknown): Promise<SendResult> {
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }).catch(() => null);

  if (!response) {
    return { ok: false, message: 'Could not reach the café rota. Check your connection.' };
  }
  if (response.ok) return { ok: true };

  const reply: unknown = await response.json().catch(() => null);
  const error =
    reply && typeof reply === 'object' && 'error' in reply && typeof reply.error === 'string'
      ? reply.error
      : 'That did not save. Please try again.';
  return { ok: false, message: error };
}
