-- ============================================================================
--  MIGRATION v2 - Perpustakaan Griya Baca
--  Fitur: perpustakaan PUBLIK (tanpa login) + BOOKMARK untuk user login
--  Jalankan seluruh isi file ini di Supabase > SQL Editor (sekali saja).
--  Aman dijalankan walau skema utama sudah ada (idempotent).
-- ============================================================================

-- 1) BUKU & PENGATURAN bisa dibaca PUBLIK (anon, tanpa login) ---------------
drop policy if exists books_read on public.books;
create policy books_read on public.books for select using (true);

drop policy if exists settings_read on public.library_settings;
create policy settings_read on public.library_settings for select using (true);

-- (Menulis buku tetap hanya staff - policy books_write tidak diubah.)

-- 2) TABEL BOOKMARK ---------------------------------------------------------
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);
create index if not exists idx_bookmarks_user on public.bookmarks (user_id, created_at desc);

alter table public.bookmarks enable row level security;

-- Setiap user hanya bisa melihat/menamb/menghapus bookmark miliknya sendiri.
drop policy if exists bookmarks_select on public.bookmarks;
create policy bookmarks_select on public.bookmarks for select using (user_id = auth.uid());

drop policy if exists bookmarks_insert on public.bookmarks;
create policy bookmarks_insert on public.bookmarks for insert with check (user_id = auth.uid());

drop policy if exists bookmarks_delete on public.bookmarks;
create policy bookmarks_delete on public.bookmarks for delete using (user_id = auth.uid());

-- Selesai. Perpustakaan kini bisa dibuka tanpa akun, dan user login bisa bookmark.
