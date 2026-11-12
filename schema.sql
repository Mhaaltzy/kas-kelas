-- Jalankan seluruh isi file ini di Supabase > SQL Editor

create table if not exists siswa (
  id      serial primary key,
  absen   int  not null unique,
  nama    text not null,
  kelamin text not null check (kelamin in ('L', 'P'))
);

-- bulan: 0 = Agustus, 1 = September, ... 11 = Juli
create table if not exists iuran (
  siswa_id int    not null references siswa(id) on delete cascade,
  bulan    int    not null check (bulan between 0 and 11),
  nominal  bigint not null default 0 check (nominal >= 0),
  primary key (siswa_id, bulan)
);

create table if not exists transaksi (
  id         bigint generated always as identity primary key,
  tipe       text   not null check (tipe in ('pemasukan', 'pengeluaran')),
  pihak      text   not null,
  tujuan     text   not null,
  nominal    bigint not null check (nominal > 0),
  tanggal    date   not null default current_date,
  created_at timestamptz not null default now()
);

-- Akses data hanya lewat server (service role), jadi RLS dikunci total
alter table siswa     enable row level security;
alter table iuran     enable row level security;
alter table transaksi enable row level security;

-- Data awal: 48 siswa
insert into siswa (absen, nama, kelamin) values
  (1,  'AKMAL MAULANA ADJI', 'L'),
  (2,  'AUFA ABDURRAHMAN', 'L'),
  (3,  'AZZAM NIZAR ANUGERAH', 'L'),
  (4,  'BEN KENJI AULIA', 'L'),
  (5,  'DZAKY FALLAH ALMAIR YUSUF', 'L'),
  (6,  'FAAZAL FATH EL FOUZ', 'L'),
  (7,  'FADAWKAS GHIMAR ANJAYA', 'L'),
  (8,  'FARASH ABQARY', 'L'),
  (9,  'FLOWER REINZY RAMBING', 'P'),
  (10, 'GHANIA ATHIMIRA SALSABILA', 'P'),
  (11, 'GREGORIUS DWI ANUGRAH CITROSISWOYO', 'L'),
  (12, 'HAFIZAM ARSYA OLVENZA', 'L'),
  (13, 'IBRAHIM RASYID BASKARA HADI', 'L'),
  (14, 'JEAN FEBRIANY CAROLYNE GURNING', 'P'),
  (15, 'JONATHAN PRAWIRA PUTRA HARDIANTO', 'L'),
  (16, 'JOYNASYA DEVINA JOHAN', 'P'),
  (17, 'KHANSA HUMAIRA', 'P'),
  (18, 'LUCKY SATRIATAMA', 'L'),
  (19, 'MARIA ANGEL ELIZABETH DAMANIK', 'P'),
  (20, 'MARULLY GABE RASNGENA MANIK', 'L'),
  (21, 'MATTHEW JANNEW DERAL J PANJAITAN', 'L'),
  (22, 'MOCCALOVA APRILIO', 'L'),
  (23, 'MOHAMAD RAFI RAMADHAN', 'L'),
  (24, 'MUHAMMAD ABDULLAH AZZAM NASUTION', 'L'),
  (25, 'MUHAMMAD ALTHAF CHALIF RASYID', 'L'),
  (26, 'MUHAMMAD HAYKAL KHAIRY KAMIL', 'L'),
  (27, 'MUHAMMAD NABIL FAYYADH SIREGAR', 'L'),
  (28, 'MUHAMMAD RAKHA FIRDAUS', 'L'),
  (29, 'MUHAMMAD TEGUH FIRMANSYAH', 'L'),
  (30, 'MUHAMMAD UMAR KHATTAB', 'L'),
  (31, 'NABIILA SYAFITRI', 'P'),
  (32, 'NABIL MUHAMMAD ARKAN', 'L'),
  (33, 'NADIA CHERYL MASTYA GHAISANI', 'P'),
  (34, 'PAULUS HASIHOLAN LUMBAN TOBING', 'L'),
  (35, 'RACHEL MEILANY HARTANTO', 'P'),
  (36, 'RAKHA ARVINO PUTRA', 'L'),
  (37, 'RAMADHAN HILMY NURWASI', 'L'),
  (38, 'RIFFAT ARIF PRAMATYO', 'L'),
  (39, 'RIZQI PUTRA ZARMAWAN', 'L'),
  (40, 'RYAN PUTRA AISADEWA', 'L'),
  (41, 'SADDAM BRAMCHO AL KINDI MISENA', 'L'),
  (42, 'SARA ALIYA MARZUQA BAHIRA', 'P'),
  (43, 'SILVIRA ANGGRAINI PUTRI', 'P'),
  (44, 'STANISLAUS MARVEL LONDAR', 'L'),
  (45, 'STARLA DIZA', 'P'),
  (46, 'SYAKIRA KARIMA', 'P'),
  (47, 'SYAVIRA ZHANATA HERALYKA', 'P'),
  (48, 'WILLIAM BRANSON MALACHI WIJONO', 'L')
on conflict (absen) do nothing;
