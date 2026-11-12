# Kas Kelas

Web pencatatan kas kelas dengan tampilan kaca blur ala iOS.
Stack: Next.js 14, TypeScript, Supabase, deploy di Vercel.

## Fitur

- Login: jabatan Bendahara, nama (Gania atau Cheryl) sebagai konfirmasi
- Tabel iuran 48 siswa, kolom Agustus sampai Juli, nominal bisa diedit
  (hijau jika 10.000 atau lebih, merah jika kurang)
- Pemasukan dan pengeluaran: pihak, tujuan, nominal, tanggal otomatis
- Konfirmasi sebelum simpan: Lanjutkan, Batalkan, Edit
- Riwayat transaksi bisa diedit dan dihapus

## Setup

### 1. Supabase

1. Buat project baru di supabase.com
2. Buka SQL Editor, jalankan seluruh isi `supabase/schema.sql`
3. Buka Project Settings > API, salin Project URL dan service_role key

### 2. GitHub

```bash
git init
git add .
git commit -m "Kas kelas"
git branch -M main
git remote add origin https://github.com/USERNAME/kas-kelas.git
git push -u origin main
```

### 3. Vercel

1. Import repo dari GitHub
2. Isi Environment Variables:

| Nama | Isi |
| --- | --- |
| `SUPABASE_URL` | Project URL dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `SESSION_SECRET` | k9#mP2$vL8@qR5!xZ7&wN4*bT1^yH6%j |
| `BENDAHARA_NAMES` | `Gania,Cheryl` |

3. Deploy

## Jalankan lokal

```bash
cp .env.example .env.local   # lalu isi nilainya
npm install
npm run dev
```

## Catatan keamanan

- Data hanya diakses lewat server, RLS Supabase dikunci total
- `SUPABASE_SERVICE_ROLE_KEY` jangan pernah dimasukkan ke kode atau repo
- Sesi login memakai cookie httpOnly yang ditandatangani, berlaku 7 hari
