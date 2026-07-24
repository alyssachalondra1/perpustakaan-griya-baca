-- ============================================================================
--  SKEMA DATABASE - Perpustakaan Griya Baca
--  Jalankan seluruh isi file ini di Supabase > SQL Editor (sekali saja).
-- ============================================================================

-- 1) ENUM ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('superadmin', 'admin', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type log_action as enum ('create','update','delete','import','export','reset_password','login');
exception when duplicate_object then null; end $$;

-- 2) TABEL PROFILES -----------------------------------------------------------
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

-- 3) SETTINGS & SEQUENCE ------------------------------------------------------
create table if not exists public.library_settings (
  id int primary key default 1,
  nama_baris1 text not null default 'PERPUSTAKAAN',
  nama_baris2 text not null default 'GRIYA BACA',
  inventaris_prefix text not null default '',
  inventaris_pad int not null default 4,
  constraint single_row check (id = 1)
);
insert into public.library_settings (id) values (1) on conflict (id) do nothing;

create sequence if not exists public.inventaris_seq start 1;

-- 4) TABEL BOOKS --------------------------------------------------------------
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
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_books_judul on public.books using gin (to_tsvector('simple', judul_buku));
create index if not exists idx_books_created on public.books (created_at desc);

-- 5) TABEL ACTIVITY LOGS ------------------------------------------------------
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

-- 6) FUNGSI NOMOR INVENTARIS OTOMATIS ----------------------------------------
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

-- 7) TRIGGER updated_at -------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_touch_books on public.books;
create trigger trg_touch_books before update on public.books
  for each row execute function public.touch_updated_at();

-- 8) HANDLE NEW USER (buat profile otomatis saat signup) ---------------------
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

-- 9) HELPER ROLE --------------------------------------------------------------
create or replace function public.current_role_is(target text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text = target);
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin') and p.is_active);
$$;

-- 10) RLS ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.activity_logs enable row level security;
alter table public.library_settings enable row level security;

-- profiles: user lihat diri sendiri; superadmin lihat semua
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select using (id = auth.uid() or public.current_role_is('superadmin'));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (id = auth.uid() or public.current_role_is('superadmin'));

-- books: semua yang login boleh baca; hanya staff boleh tulis
drop policy if exists books_read on public.books;
create policy books_read on public.books for select using (auth.role() = 'authenticated');
drop policy if exists books_write on public.books;
create policy books_write on public.books for all using (public.is_staff()) with check (public.is_staff());

-- logs & settings: superadmin only
drop policy if exists logs_super on public.activity_logs;
create policy logs_super on public.activity_logs for select using (public.current_role_is('superadmin'));
drop policy if exists logs_insert on public.activity_logs;
create policy logs_insert on public.activity_logs for insert with check (public.is_staff());
drop policy if exists settings_read on public.library_settings;
create policy settings_read on public.library_settings for select using (auth.role() = 'authenticated');
drop policy if exists settings_write on public.library_settings;
create policy settings_write on public.library_settings for all using (public.current_role_is('superadmin')) with check (public.current_role_is('superadmin'));

-- 11) VIEW REKAP --------------------------------------------------------------
create or replace view public.rekap_inventaris as
  select tanggal_terima as tanggal, sum(jumlah_eksemplar)::int as jumlah, count(*)::int as judul
  from public.books group by tanggal_terima order by tanggal_terima desc;
