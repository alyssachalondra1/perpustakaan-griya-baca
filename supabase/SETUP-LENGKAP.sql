-- ============================================================================
--  SETUP LENGKAP - Perpustakaan Ibnu Abbas (Sistem Inventaris)
--  ---------------------------------------------------------------------------
--  SATU FILE dari nol sampai versi final. Jalankan SELURUH isi file ini di:
--    Supabase > SQL Editor > New query > tempel semua > Run.
--  Aman dijalankan ulang (idempotent).
--
--  MAU DIPAKAI UNTUK PERPUS LAIN? Ubah 3 baris ber-tanda [GANTI] di bawah.
-- ============================================================================

-- ============================================================================
--  1) ENUM
-- ============================================================================
do $$ begin
  create type user_role as enum ('superadmin', 'admin', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type log_action as enum ('create','update','delete','import','export','reset_password','login');
exception when duplicate_object then null; end $$;

-- ============================================================================
--  2) TABEL PROFILES
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  email text,
  avatar_url text,
  role user_role not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
--  3) SETTINGS & SEQUENCE NOMOR INVENTARIS
-- ============================================================================
create table if not exists public.library_settings (
  id int primary key default 1,
  nama_baris1 text not null default 'Perpustakaan',
  nama_baris2 text not null default 'Ibnu Abbas',   -- [GANTI] nama sekolah/perpus utk label buku
  inventaris_prefix text not null default '',        -- [GANTI opsional] awalan nomor inventaris, mis. 'IA-'
  inventaris_pad int not null default 4,             -- jumlah digit nomor, mis. 4 -> 0001
  constraint single_row check (id = 1)
);
insert into public.library_settings (id) values (1) on conflict (id) do nothing;
-- Pastikan nilai baris label sesuai (kalau tabel sudah ada dari sebelumnya):
update public.library_settings
  set nama_baris1 = 'Perpustakaan', nama_baris2 = 'Ibnu Abbas'  -- [GANTI] nama sekolah
  where id = 1;

create sequence if not exists public.inventaris_seq start 1;

-- ============================================================================
--  4) TABEL BOOKS (termasuk kolom label_printed_at = penanda sudah dicetak)
-- ============================================================================
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  tanggal_terima date not null default current_date,
  nomor_inventaris text unique,
  judul_buku text not null,
  pengarang text not null,
  penerbit text,
  tahun_terbit text,
  jumlah_eksemplar int not null default 1,
  subjek text,
  sumber text,
  keterangan text,
  nomor_klasifikasi text,
  nm_pngrng text,
  prtm_jdl text,
  perjenjangan text,
  isbn text,
  cover_url text,
  deskripsi text,
  input_method text default 'manual',
  label_printed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Kolom label_printed_at (kalau tabel books sudah ada dari sebelumnya):
alter table public.books add column if not exists label_printed_at timestamptz;

create index if not exists idx_books_judul on public.books using gin (to_tsvector('simple', judul_buku));
create index if not exists idx_books_created on public.books (created_at desc);
create index if not exists idx_books_label_printed on public.books (label_printed_at);

-- ============================================================================
--  5) TABEL ACTIVITY LOGS (riwayat perubahan)
-- ============================================================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username text,
  action log_action not null,
  record_id text,
  judul_buku text,
  data_before jsonb,
  data_after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_logs_created on public.activity_logs (created_at desc);

-- ============================================================================
--  6) TABEL BOOKMARKS (buku tersimpan untuk pengunjung yang login)
-- ============================================================================
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);
create index if not exists idx_bookmarks_user on public.bookmarks (user_id, created_at desc);

-- ============================================================================
--  7) FUNGSI NOMOR INVENTARIS OTOMATIS
-- ============================================================================
create or replace function public.set_nomor_inventaris()
returns trigger language plpgsql as $$
declare
  s record;
  n bigint;
begin
  if new.nomor_inventaris is null or new.nomor_inventaris = '' then
    select * into s from public.library_settings where id = 1;
    n := nextval('public.inventaris_seq');
    new.nomor_inventaris := coalesce(s.inventaris_prefix, '') || lpad(n::text, coalesce(s.inventaris_pad, 4), '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_set_nomor_inventaris on public.books;
create trigger trg_set_nomor_inventaris before insert on public.books
  for each row execute function public.set_nomor_inventaris();

-- ============================================================================
--  8) TRIGGER updated_at
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_touch_books on public.books;
create trigger trg_touch_books before update on public.books
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  9) BUAT PROFILE OTOMATIS SAAT SIGNUP
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, email, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'user')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
--  10) HELPER ROLE
-- ============================================================================
create or replace function public.current_role_is(target text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text = target);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin') and p.is_active);
$$;

-- ============================================================================
--  11) ROW LEVEL SECURITY
--  Catatan: books & settings BISA DIBACA PUBLIK (tanpa login) supaya halaman
--  perpustakaan bisa dibuka pengunjung umum. Menulis tetap hanya staff.
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.activity_logs enable row level security;
alter table public.library_settings enable row level security;
alter table public.bookmarks enable row level security;

-- profiles: user lihat diri sendiri; superadmin lihat semua
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select using (id = auth.uid() or public.current_role_is('superadmin'));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (id = auth.uid() or public.current_role_is('superadmin'));

-- books: SIAPA SAJA boleh baca (publik); hanya staff boleh tulis
drop policy if exists books_read on public.books;
create policy books_read on public.books for select using (true);
drop policy if exists books_write on public.books;
create policy books_write on public.books for all using (public.is_staff()) with check (public.is_staff());

-- logs: superadmin baca, staff insert
drop policy if exists logs_super on public.activity_logs;
create policy logs_super on public.activity_logs for select using (public.current_role_is('superadmin'));
drop policy if exists logs_insert on public.activity_logs;
create policy logs_insert on public.activity_logs for insert with check (public.is_staff());

-- settings: SIAPA SAJA boleh baca (dipakai halaman publik); superadmin boleh tulis
drop policy if exists settings_read on public.library_settings;
create policy settings_read on public.library_settings for select using (true);
drop policy if exists settings_write on public.library_settings;
create policy settings_write on public.library_settings for all using (public.current_role_is('superadmin')) with check (public.current_role_is('superadmin'));

-- bookmarks: tiap user hanya bookmark miliknya
drop policy if exists bookmarks_select on public.bookmarks;
create policy bookmarks_select on public.bookmarks for select using (user_id = auth.uid());
drop policy if exists bookmarks_insert on public.bookmarks;
create policy bookmarks_insert on public.bookmarks for insert with check (user_id = auth.uid());
drop policy if exists bookmarks_delete on public.bookmarks;
create policy bookmarks_delete on public.bookmarks for delete using (user_id = auth.uid());

-- ============================================================================
--  12) VIEW REKAP
-- ============================================================================
create or replace view public.rekap_inventaris as
  select tanggal_terima as tanggal, sum(jumlah_eksemplar)::int as jumlah, count(*)::int as judul
  from public.books group by tanggal_terima order by tanggal_terima desc;

-- ============================================================================
--  13) MEMBUAT AKUN SUPERADMIN (jalankan SETELAH akunnya dibuat)
--  ---------------------------------------------------------------------------
--  Cara: Supabase > Authentication > Users > Add user (email + password).
--  Untuk login-username: pakai email <username>@<DOMAIN> yang sama dengan
--  NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN di .env.local (mis. superadmin@ibnuabbas.local).
--  Lalu naikkan rolenya jadi superadmin dengan mengganti email di bawah:
--
--  update public.profiles set role = 'superadmin', is_active = true,
--    username = 'superadmin'
--  where email = 'superadmin@ibnuabbas.local';   -- [GANTI] email admin utama
--
--  (Admin biasa: sama, tapi role = 'admin'.)
-- ============================================================================

-- SELESAI.
