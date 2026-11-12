import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { fail, guard, parseTx } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = guard();
  if (denied) return denied;

  const id = Number(params.id);
  if (!Number.isInteger(id)) return fail('ID tidak valid');

  const body = await req.json().catch(() => ({}));
  const { data, error } = parseTx(body);
  if (!data) return fail(error || 'Data tidak valid');

  const res = await db()
    .from('transaksi')
    .update(data)
    .eq('id', id)
    .select('id, tipe, pihak, tujuan, nominal, tanggal')
    .single();

  if (res.error) return fail(res.error.message, 500);
  return NextResponse.json(res.data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = guard();
  if (denied) return denied;

  const id = Number(params.id);
  if (!Number.isInteger(id)) return fail('ID tidak valid');

  const { error } = await db().from('transaksi').delete().eq('id', id);
  if (error) return fail(error.message, 500);
  return NextResponse.json({ ok: true });
}
