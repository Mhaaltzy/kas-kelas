import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { fail, guard } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  const denied = guard();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const siswa_id = Number(body.siswa_id);
  const bulan = Number(body.bulan);
  const nominal = Number(body.nominal);

  if (!Number.isInteger(siswa_id) || siswa_id <= 0) return fail('Siswa tidak valid');
  if (!Number.isInteger(bulan) || bulan < 0 || bulan > 11) return fail('Bulan tidak valid');
  if (!Number.isInteger(nominal) || nominal < 0) return fail('Nominal tidak valid');

  const { error } = await db()
    .from('iuran')
    .upsert({ siswa_id, bulan, nominal }, { onConflict: 'siswa_id,bulan' });

  if (error) return fail(error.message, 500);
  return NextResponse.json({ ok: true });
}
