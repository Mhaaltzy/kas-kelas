import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { fail, guard, parseTx } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const denied = guard();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const { data, error } = parseTx(body);
  if (!data) return fail(error || 'Data tidak valid');

  const res = await db()
    .from('transaksi')
    .insert(data)
    .select('id, tipe, pihak, tujuan, nominal, tanggal')
    .single();

  if (res.error) return fail(res.error.message, 500);
  return NextResponse.json(res.data);
}
