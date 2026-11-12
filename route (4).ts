import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { fail, guard } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = guard();
  if (denied) return denied;

  const sb = db();
  const [siswa, iuran, transaksi] = await Promise.all([
    sb.from('siswa').select('id, absen, nama, kelamin').order('absen'),
    sb.from('iuran').select('siswa_id, bulan, nominal'),
    sb
      .from('transaksi')
      .select('id, tipe, pihak, tujuan, nominal, tanggal')
      .order('tanggal', { ascending: false })
      .order('id', { ascending: false }),
  ]);

  const err = siswa.error || iuran.error || transaksi.error;
  if (err) return fail(err.message, 500);

  return NextResponse.json({
    siswa: siswa.data,
    iuran: iuran.data,
    transaksi: transaksi.data,
  });
}
