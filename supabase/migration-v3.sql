-- ============================================================================
--  MIGRATION v3 - Perpustakaan Ibnu Abbas
--  1) penanda "sudah dicetak" untuk label buku
--  2) set baris label: "Perpustakaan" / "Ibnu Abbas"
--  Jalankan di Supabase > SQL Editor (sekali saja). Aman (idempotent).
-- ============================================================================

-- Kolom penanda kapan label buku terakhir dicetak (DOCX diunduh / PDF dicetak).
-- NULL = belum pernah dicetak.
alter table public.books add column if not exists label_printed_at timestamptz;
create index if not exists idx_books_label_printed on public.books (label_printed_at);

-- Baris label buku: baris1 = "Perpustakaan", baris2 = nama sekolah.
update public.library_settings
  set nama_baris1 = 'Perpustakaan', nama_baris2 = 'Ibnu Abbas'
  where id = 1;

-- Selesai.
