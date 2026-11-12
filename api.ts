import { NextResponse } from 'next/server';
import { getSession } from './auth';

export function guard(): NextResponse | null {
  if (!getSession()) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  }
  return null;
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export type TxInput = {
  tipe: 'pemasukan' | 'pengeluaran';
  pihak: string;
  tujuan: string;
  nominal: number;
  tanggal: string;
};

// Validasi body transaksi, return data bersih atau pesan error
export function parseTx(body: any): { data?: TxInput; error?: string } {
  const tipe = body?.tipe;
  const pihak = String(body?.pihak ?? '').trim();
  const tujuan = String(body?.tujuan ?? '').trim();
  const nominal = Number(body?.nominal);
  const tanggal = String(body?.tanggal ?? '');

  if (tipe !== 'pemasukan' && tipe !== 'pengeluaran') return { error: 'Jenis tidak valid' };
  if (!pihak) return { error: 'Nama pihak wajib diisi' };
  if (!tujuan) return { error: 'Tujuan wajib diisi' };
  if (!Number.isInteger(nominal) || nominal <= 0) return { error: 'Nominal harus lebih dari 0' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return { error: 'Tanggal tidak valid' };

  return { data: { tipe, pihak, tujuan, nominal, tanggal } };
}
