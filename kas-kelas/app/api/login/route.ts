import { NextResponse } from 'next/server';
import { COOKIE_NAME, allowedNames, createToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const jabatan = String(body.jabatan ?? '').trim();
  const nama = String(body.nama ?? '').trim();

  const valid =
    jabatan === 'Bendahara' && allowedNames().includes(nama.toLowerCase());

  if (!valid) {
    // jeda kecil biar susah ditebak-tebak
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Nama tidak cocok' }, { status: 401 });
  }

  // Tampilkan nama dengan huruf awal kapital
  const tampil = nama.charAt(0).toUpperCase() + nama.slice(1).toLowerCase();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, createToken(tampil), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
