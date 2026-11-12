import crypto from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE_NAME = 'kas_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET belum diisi');
  return s;
}

function hmac(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function allowedNames(): string[] {
  return (process.env.BENDAHARA_NAMES || 'Gania,Cheryl')
    .split(',')
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
}

export function createToken(nama: string): string {
  const payload = Buffer.from(
    JSON.stringify({ n: nama, exp: Date.now() + MAX_AGE_MS })
  ).toString('base64url');
  return `${payload}.${hmac(payload)}`;
}

export function verifyToken(token?: string): { nama: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = hmac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return { nama: String(data.n) };
  } catch {
    return null;
  }
}

export function getSession(): { nama: string } | null {
  return verifyToken(cookies().get(COOKIE_NAME)?.value);
}
