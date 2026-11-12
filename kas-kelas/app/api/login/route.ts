import { NextResponse } from 'next/server';
import { COOKIE_NAME, createToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Baca daftar nama dari env, toleran terhadap kutip, spasi, titik koma
function daftarNama(): string[] {
  const raw = process.env.BENDAHARA_NAMES || 'Gania,Cheryl';
  return raw
    .split(/[,;\n]/)
    .map((n) => n.replace(/["']/g, '').trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const jabatan = String(body.jabatan ?? '').trim();
  const nama = String(body.nama ?? '').trim();

  const valid = jabatan === 'Bendahara' && daftarNama().includes(nama.toLowerCase());

  if (!valid) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Nama tidak cocok' }, { status: 401 });
  }

  if (!process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: 'Server belum siap: SESSION_SECRET belum diisi di Vercel' },
      { status: 500 }
    );
  }

  const tampil = nama.charAt(0).toUpperCase() + nama.slice(1).toLowerCase();

  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, createToken(tampil), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Server error: ' + (e?.message || 'tidak diketahui') },
      { status: 500 }
    );
  }
}
