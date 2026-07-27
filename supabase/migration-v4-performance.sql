-- ============================================================================
--  migration-v4-performance.sql  (OPSIONAL tapi disarankan)
--  Perbaikan performa agar export & tampilan pengunjung tidak "timeout"
--  saat jumlah buku sudah banyak. TIDAK menghapus / mengubah data apa pun.
--  Jalankan di: Supabase > SQL Editor > Run.  Aman diulang.
-- ============================================================================

-- 1) Index untuk urutan export (diurutkan berdasar nomor inventaris)
create index if not exists idx_books_nomor_inventaris on public.books (nomor_inventaris);

-- 2) Index judul untuk pencarian (kalau belum ada)
create index if not exists idx_books_created on public.books (created_at desc);

-- 3) Naikkan batas waktu query (statement timeout) untuk request lewat API.
--    Default Supabase kecil; ini menaikkannya supaya query besar tidak keburu
--    dibatalkan. Aman & bisa dikembalikan kapan saja.
alter role authenticated set statement_timeout = '30s';
alter role anon set statement_timeout = '20s';

-- Setelah menjalankan ini, muat ulang schema PostgREST (opsional):
notify pgrst, 'reload config';

-- SELESAI. Data tidak tersentuh.
