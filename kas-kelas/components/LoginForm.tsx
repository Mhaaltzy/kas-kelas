'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!nama.trim()) {
      setError('Isi nama dulu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jabatan: 'Bendahara', nama }),
      });
      if (res.ok) {
        router.replace('/dashboard');
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Gagal masuk');
    } catch {
      setError('Koneksi bermasalah, coba lagi');
    }
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      <form className="glass login-card" onSubmit={submit}>
        <div className="login-icon">💰</div>
        <h1>Kas Kelas</h1>
        <p className="sub">Masuk untuk mengelola keuangan kelas</p>

        <div className="field">
          <label>Jabatan</label>
          <div className="pill-static">
            <span>🔐</span>
            <span>Bendahara</span>
            <span className="tag">Tetap</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="nama">Nama</label>
          <div className="pw-row">
            <input
              id="nama"
              className="input"
              type={show ? 'text' : 'password'}
              placeholder="Masukkan nama untuk konfirmasi"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Sembunyikan nama' : 'Tampilkan nama'}
            >
              {show ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn primary block" disabled={loading}>
          {loading ? 'Memeriksa...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
