// Password verification + session handling.
//
// Same-origin deployment (/admin and /api on www.covenantseniorbenefits.com)
// lets us use an httpOnly SameSite=Strict cookie, so page JS can never read
// the session token and XSS can't exfiltrate it.

const COOKIE = 'csb_session';
const MAX_FAILS = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

const b64ToBytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [scheme, iterStr, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'pbkdf2') return false;

  const expected = b64ToBytes(hashB64);
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: b64ToBytes(saltB64),
      iterations: parseInt(iterStr, 10),
      hash: 'SHA-256',
    },
    key,
    expected.length * 8
  );
  return timingSafeEqual(new Uint8Array(bits), expected);
}

export async function checkThrottle(db, ip) {
  const row = await db.prepare('SELECT fails, locked_until FROM login_attempts WHERE ip = ?')
    .bind(ip).first();
  if (row && row.locked_until > Date.now()) {
    return { locked: true, retryAfter: Math.ceil((row.locked_until - Date.now()) / 1000) };
  }
  return { locked: false };
}

export async function recordFailure(db, ip) {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO login_attempts (ip, fails, locked_until) VALUES (?1, 1, 0)
    ON CONFLICT(ip) DO UPDATE SET
      fails = fails + 1,
      locked_until = CASE WHEN fails + 1 >= ?2 THEN ?3 ELSE locked_until END
  `).bind(ip, MAX_FAILS, now + LOCKOUT_MS).run();
}

export async function clearFailures(db, ip) {
  await db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
}

export async function createSession(db, ttlHours) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const id = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  const now = Date.now();
  const expires = now + ttlHours * 3600 * 1000;
  await db.prepare(
    'INSERT INTO sessions (id, created_at, expires_at, last_seen) VALUES (?, ?, ?, ?)'
  ).bind(id, now, expires, now).run();
  return { id, expires };
}

export function readSessionCookie(request) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return null;
}

// Returns the session row, or null. Sweeps expired rows opportunistically.
export async function getSession(db, request) {
  const id = readSessionCookie(request);
  if (!id) return null;
  const row = await db.prepare('SELECT id, expires_at FROM sessions WHERE id = ?')
    .bind(id).first();
  if (!row) return null;
  if (row.expires_at <= Date.now()) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
    return null;
  }
  return row;
}

export async function destroySession(db, request) {
  const id = readSessionCookie(request);
  if (id) await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
}

export async function sweepExpired(db) {
  await db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(Date.now()).run();
}

export function sessionCookie(id, expires) {
  const maxAge = Math.max(0, Math.floor((expires - Date.now()) / 1000));
  return `${COOKIE}=${id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export const clearCookie = () =>
  `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
