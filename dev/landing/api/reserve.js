import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

export async function POST(request) {
  const { email } = await request.json().catch(() => ({}));
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  // ponytail: 예약 1건 = private blob 1개. 목록은 `vercel blob list`로 확인, 규모 커지면 DB로.
  await put(`reservations/${Date.now()}-${randomUUID()}.json`,
    JSON.stringify({ email: email.trim().toLowerCase(), at: new Date().toISOString() }),
    { access: 'private', contentType: 'application/json' });
  return Response.json({ ok: true });
}
