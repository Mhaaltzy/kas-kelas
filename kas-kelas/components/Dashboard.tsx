'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Siswa = { id: number; absen: number; nama: string; kelamin: 'L' | 'P' };
type IuranRow = { siswa_id: number; bulan: number; nominal: number };
type Tipe = 'pemasukan' | 'pengeluaran';
type Tx = { id: number; tipe: Tipe; pihak: string; tujuan: string; nominal: number; tanggal: string };
type Draft = { tipe: Tipe; pihak: string; tujuan: string; nominal: string; tanggal: string };

const BULAN = [
  'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari',
  'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
];
const TARGET = 10000;

const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const digits = (s: string) => s.replace(/\D/g, '');
const todayJakarta = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
const fmtTanggal = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
const emptyDraft = (): Draft => ({
  tipe: 'pengeluaran', pihak: '', tujuan: '', nominal: '', tanggal: todayJakarta(),
});

/* ---------- Sel nominal (bisa diedit) ---------- */
function NominalCell({ value, onSave }: { value: number; onSave: (n: number) => void }) {
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);
  const ok = value >= TARGET;

  const commit = () => {
    setFocus(false);
    const n = parseInt(digits(text) || '0', 10);
    if (n !== value) onSave(n);
  };

  return (
    <td className={'cell ' + (ok ? 'ok' : 'bad')}>
      <span className="dot" />
      <input
        className="nom"
        inputMode="numeric"
        value={focus ? text : value.toLocaleString('id-ID')}
        onFocus={(e) => {
          setFocus(true);
          setText(value ? String(value) : '');
          const el = e.target;
          setTimeout(() => el.select(), 0);
        }}
        onChange={(e) => setText(digits(e.target.value))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setText(String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        aria-label="Nominal iuran"
      />
    </td>
  );
}

/* ---------- Form transaksi (dipakai form utama dan modal edit) ---------- */
function TxForm({
  draft, setDraft, dateEditable,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  dateEditable: boolean;
}) {
  const masuk = draft.tipe === 'pemasukan';
  const nominalNum = parseInt(digits(draft.nominal) || '0', 10);

  return (
    <>
      <div className="type-toggle">
        <button type="button" className={'in ' + (masuk ? 'on' : '')}
          onClick={() => setDraft({ ...draft, tipe: 'pemasukan' })}>
          ⬇️ Pemasukan
        </button>
        <button type="button" className={'out ' + (!masuk ? 'on' : '')}
          onClick={() => setDraft({ ...draft, tipe: 'pengeluaran' })}>
          ⬆️ Pengeluaran
        </button>
      </div>

      <div className="field">
        <label>{masuk ? 'Diterima dari siapa' : 'Dikeluarkan oleh siapa'}</label>
        <input className="input" placeholder="Nama"
          value={draft.pihak}
          onChange={(e) => setDraft({ ...draft, pihak: e.target.value })} />
      </div>

      <div className="field">
        <label>Tujuan</label>
        <input className="input"
          placeholder={masuk ? 'Contoh: donasi, hasil jualan' : 'Contoh: beli spidol, fotokopi'}
          value={draft.tujuan}
          onChange={(e) => setDraft({ ...draft, tujuan: e.target.value })} />
      </div>

      <div className="field">
        <label>Nominal</label>
        <div className="nominal-wrap">
          <span className="rp">Rp</span>
          <input className="input" inputMode="numeric" placeholder="0"
            value={nominalNum ? nominalNum.toLocaleString('id-ID') : ''}
            onChange={(e) => setDraft({ ...draft, nominal: digits(e.target.value) })} />
        </div>
      </div>

      <div className="field">
        <label>
          Tanggal
          {!dateEditable && <span className="auto-badge">otomatis</span>}
        </label>
        {dateEditable ? (
          <input className="input" type="date" value={draft.tanggal}
            onChange={(e) => setDraft({ ...draft, tanggal: e.target.value })} />
        ) : (
          <input className="input" readOnly value={fmtTanggal(draft.tanggal)} />
        )}
      </div>
    </>
  );
}

function validate(d: Draft): string {
  if (!d.pihak.trim()) return d.tipe === 'pemasukan' ? 'Isi diterima dari siapa' : 'Isi dikeluarkan oleh siapa';
  if (!d.tujuan.trim()) return 'Isi tujuannya dulu';
  if (!parseInt(digits(d.nominal) || '0', 10)) return 'Nominal belum diisi';
  if (!d.tanggal) return 'Tanggal belum diisi';
  return '';
}

function toPayload(d: Draft) {
  return {
    tipe: d.tipe,
    pihak: d.pihak.trim(),
    tujuan: d.tujuan.trim(),
    nominal: parseInt(digits(d.nominal), 10),
    tanggal: d.tanggal,
  };
}

/* ---------- Komponen utama ---------- */
export default function Dashboard({ nama }: { nama: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [iuran, setIuran] = useState<Record<string, number>>({});
  const [tx, setTx] = useState<Tx[]>([]);
  const [tab, setTab] = useState<'iuran' | 'transaksi'>('iuran');
  const [pinNama, setPinNama] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ id: number; draft: Draft } | null>(null);

  const notify = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const unauthorized = useCallback(() => {
    router.replace('/');
    router.refresh();
  }, [router]);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (res.status === 401) return unauthorized();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat');
      setSiswa(data.siswa);
      const map: Record<string, number> = {};
      (data.iuran as IuranRow[]).forEach((r) => { map[`${r.siswa_id}-${r.bulan}`] = Number(r.nominal); });
      setIuran(map);
      setTx((data.transaksi as Tx[]).map((t) => ({ ...t, nominal: Number(t.nominal) })));
    } catch (e: any) {
      notify(e.message || 'Gagal memuat data', 'err');
    }
    setLoading(false);
  }, [notify, unauthorized]);

  useEffect(() => { load(); }, [load]);

  // tanggal selalu mengikuti hari ini saat membuka tab transaksi
  useEffect(() => {
    if (tab === 'transaksi' && !confirming) setDraft((d) => ({ ...d, tanggal: todayJakarta() }));
  }, [tab, confirming]);

  /* simpan iuran dengan update langsung, balik kalau gagal */
  async function saveIuran(siswa_id: number, bulan: number, nominal: number) {
    const key = `${siswa_id}-${bulan}`;
    const before = iuran[key] ?? 0;
    setIuran((m) => ({ ...m, [key]: nominal }));
    try {
      const res = await fetch('/api/iuran', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswa_id, bulan, nominal }),
      });
      if (res.status === 401) return unauthorized();
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menyimpan');
    } catch (e: any) {
      setIuran((m) => ({ ...m, [key]: before }));
      notify(e.message || 'Gagal menyimpan', 'err');
    }
  }

  async function submitNew() {
    setSaving(true);
    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(draft)),
      });
      if (res.status === 401) return unauthorized();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      setTx((list) => [{ ...data, nominal: Number(data.nominal) }, ...list]);
      setConfirming(false);
      setDraft({ ...emptyDraft(), tipe: draft.tipe });
      notify('Transaksi tersimpan');
    } catch (e: any) {
      notify(e.message || 'Gagal menyimpan', 'err');
    }
    setSaving(false);
  }

  async function submitEdit() {
    if (!editing) return;
    const err = validate(editing.draft);
    if (err) return notify(err, 'err');
    setSaving(true);
    try {
      const res = await fetch(`/api/transaksi/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(editing.draft)),
      });
      if (res.status === 401) return unauthorized();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      setTx((list) => list.map((t) => (t.id === editing.id ? { ...data, nominal: Number(data.nominal) } : t)));
      setEditing(null);
      notify('Perubahan tersimpan');
    } catch (e: any) {
      notify(e.message || 'Gagal menyimpan', 'err');
    }
    setSaving(false);
  }

  async function removeTx(t: Tx) {
    if (!window.confirm(`Hapus transaksi "${t.tujuan}" sebesar ${rp(t.nominal)}?`)) return;
    try {
      const res = await fetch(`/api/transaksi/${t.id}`, { method: 'DELETE' });
      if (res.status === 401) return unauthorized();
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal menghapus');
      setTx((list) => list.filter((x) => x.id !== t.id));
      notify('Transaksi dihapus');
    } catch (e: any) {
      notify(e.message || 'Gagal menghapus', 'err');
    }
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/');
    router.refresh();
  }

  /* ringkasan */
  const totalIuran = useMemo(() => Object.values(iuran).reduce((a, b) => a + b, 0), [iuran]);
  const totalMasuk = useMemo(() => tx.filter((t) => t.tipe === 'pemasukan').reduce((a, t) => a + t.nominal, 0), [tx]);
  const totalKeluar = useMemo(() => tx.filter((t) => t.tipe === 'pengeluaran').reduce((a, t) => a + t.nominal, 0), [tx]);
  const saldo = totalIuran + totalMasuk - totalKeluar;
  const totalPerBulan = useMemo(
    () => BULAN.map((_, b) => siswa.reduce((a, s) => a + (iuran[`${s.id}-${b}`] ?? 0), 0)),
    [siswa, iuran]
  );

  function onSelesai() {
    const err = validate(draft);
    if (err) return notify(err, 'err');
    setConfirming(true);
  }

  const masukDraft = draft.tipe === 'pemasukan';

  return (
    <div className="shell">
      <header className="glass topbar">
        <div className="brand">
          <div className="logo">💰</div>
          <div>
            <h2>Kas Kelas</h2>
            <small>Tahun ajaran Agustus sampai Juli</small>
          </div>
        </div>
        <div className="spacer" />
        <div className="user-chip">
          <span className="avatar">{nama.charAt(0)}</span>
          Bendahara {nama}
        </div>
        <button className="btn small" onClick={logout}>Keluar</button>
      </header>

      <section className="stats">
        <div className="glass stat">
          <div className="lbl">Iuran terkumpul</div>
          <div className="val">{rp(totalIuran)}</div>
        </div>
        <div className="glass stat">
          <div className="lbl">Pemasukan lain</div>
          <div className="val pos">{rp(totalMasuk)}</div>
        </div>
        <div className="glass stat">
          <div className="lbl">Pengeluaran</div>
          <div className="val neg">{rp(totalKeluar)}</div>
        </div>
        <div className="glass stat saldo">
          <div className="lbl">Saldo kas</div>
          <div className={'val ' + (saldo < 0 ? 'neg' : '')}>{rp(saldo)}</div>
        </div>
      </section>

      <div className="seg">
        <button className={tab === 'iuran' ? 'on' : ''} onClick={() => setTab('iuran')}>📋 Iuran Kas</button>
        <button className={tab === 'transaksi' ? 'on' : ''} onClick={() => setTab('transaksi')}>🧾 Pemasukan dan Pengeluaran</button>
      </div>

      {loading ? (
        <div className="glass panel loading">Memuat data...</div>
      ) : tab === 'iuran' ? (
        <section className="glass panel">
          <div className="panel-head">
            <h3>Iuran kas per siswa</h3>
            <button type="button" className="btn small pin-btn" onClick={() => setPinNama((p) => !p)}>
              {pinNama ? '📌 Nama dikunci' : '📌 Kunci nama'}
            </button>
            <div className="spacer" />
            <div className="legend">
              <span><i style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} /> Lunas (minimal {rp(TARGET)})</span>
              <span><i style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} /> Kurang</span>
            </div>
          </div>

          <div className={'table-wrap' + (pinNama ? ' pin' : '')}>
            <table className="kas">
              <thead>
                <tr>
                  <th className="c-absen">No</th>
                  <th className="c-nama">Nama</th>
                  <th>L/P</th>
                  {BULAN.map((b) => <th key={b}>{b}</th>)}
                  <th className="c-total">Total</th>
                </tr>
              </thead>
              <tbody>
                {siswa.map((s) => {
                  const total = BULAN.reduce((a, _, b) => a + (iuran[`${s.id}-${b}`] ?? 0), 0);
                  return (
                    <tr key={s.id}>
                      <td className="c-absen">{s.absen}</td>
                      <td className="c-nama" title={s.nama}>{s.nama}</td>
                      <td className="c-kel"><span className={'kel ' + s.kelamin}>{s.kelamin}</span></td>
                      {BULAN.map((_, b) => (
                        <NominalCell
                          key={b}
                          value={iuran[`${s.id}-${b}`] ?? 0}
                          onSave={(n) => saveIuran(s.id, b, n)}
                        />
                      ))}
                      <td className="c-total">{rp(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="lbl" colSpan={3}>Total per bulan</td>
                  {totalPerBulan.map((t, i) => <td key={i}>{rp(t)}</td>)}
                  <td>{rp(totalIuran)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="hint">Klik angka di kolom bulan untuk mengubah nominal, tekan Enter atau pindah kolom untuk menyimpan. Hijau jika {rp(TARGET)} atau lebih, merah jika kurang.</p>
        </section>
      ) : (
        <div className="tx-grid">
          <section className="glass panel">
            <div className="panel-head"><h3>Catat transaksi</h3></div>
            <TxForm draft={draft} setDraft={setDraft} dateEditable={false} />
            <button className="btn primary block" onClick={onSelesai}>Selesai</button>
          </section>

          <section className="glass panel">
            <div className="panel-head">
              <h3>Riwayat</h3>
              <div className="spacer" />
              <div className="legend"><span>{tx.length} transaksi</span></div>
            </div>
            {tx.length === 0 ? (
              <div className="empty">Belum ada transaksi. Catat yang pertama di sebelah kiri.</div>
            ) : (
              <div className="tx-list">
                {tx.map((t) => {
                  const masuk = t.tipe === 'pemasukan';
                  return (
                    <div className="tx-item" key={t.id}>
                      <div className={'tx-ico ' + (masuk ? 'in' : 'out')}>{masuk ? '⬇️' : '⬆️'}</div>
                      <div className="tx-main">
                        <b>{t.tujuan}</b>
                        <small>{masuk ? 'Dari' : 'Oleh'} {t.pihak} · {fmtTanggal(t.tanggal)}</small>
                      </div>
                      <div className={'tx-amt ' + (masuk ? 'in' : 'out')}>
                        {masuk ? '+' : '-'} {rp(t.nominal)}
                      </div>
                      <div className="tx-actions">
                        <button className="btn small"
                          onClick={() => setEditing({
                            id: t.id,
                            draft: { tipe: t.tipe, pihak: t.pihak, tujuan: t.tujuan, nominal: String(t.nominal), tanggal: t.tanggal },
                          })}>
                          Edit
                        </button>
                        <button className="btn small" onClick={() => removeTx(t)} aria-label="Hapus">🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Konfirmasi: Lanjutkan, Batalkan, Edit */}
      {confirming && (
        <div className="overlay" onClick={() => !saving && setConfirming(false)}>
          <div className="glass sheet" onClick={(e) => e.stopPropagation()}>
            <h3>Konfirmasi transaksi</h3>
            <p className="sub">Cek lagi sebelum disimpan</p>
            <div className="summary">
              <div className="row"><span>Jenis</span><span>{masukDraft ? 'Pemasukan' : 'Pengeluaran'}</span></div>
              <div className="row"><span>{masukDraft ? 'Diterima dari' : 'Dikeluarkan oleh'}</span><span>{draft.pihak.trim()}</span></div>
              <div className="row"><span>Tujuan</span><span>{draft.tujuan.trim()}</span></div>
              <div className="row"><span>Nominal</span><span>{rp(parseInt(digits(draft.nominal) || '0', 10))}</span></div>
              <div className="row"><span>Tanggal</span><span>{fmtTanggal(draft.tanggal)}</span></div>
            </div>
            <div className="sheet-actions">
              <button className="btn danger" disabled={saving}
                onClick={() => { setConfirming(false); setDraft(emptyDraft()); }}>
                Batalkan
              </button>
              <button className="btn" disabled={saving} onClick={() => setConfirming(false)}>Edit</button>
              <button className="btn primary" disabled={saving} onClick={submitNew}>
                {saving ? 'Menyimpan...' : 'Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit transaksi yang sudah tersimpan */}
      {editing && (
        <div className="overlay" onClick={() => !saving && setEditing(null)}>
          <div className="glass sheet" onClick={(e) => e.stopPropagation()}>
            <h3>Edit transaksi</h3>
            <p className="sub">Ubah data lalu simpan</p>
            <TxForm
              draft={editing.draft}
              setDraft={(d) => setEditing({ id: editing.id, draft: d })}
              dateEditable
            />
            <div className="sheet-actions two">
              <button className="btn" disabled={saving} onClick={() => setEditing(null)}>Batal</button>
              <button className="btn primary" disabled={saving} onClick={submitEdit}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={'toast ' + toast.type}>{toast.msg}</div>}
    </div>
  );
}
