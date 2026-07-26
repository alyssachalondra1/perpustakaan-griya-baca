-- ============================================================================
--  MIGRATION v3 - Perpustakaan Griya Baca
--  Fitur: penanda "sudah dicetak" untuk label buku.
--  Jalankan di Supabase > SQL Editor (sekali saja). Aman (idempotent).
-- ============================================================================

-- Kolom penanda kapan label buku terakhir dicetak (DOCX diunduh / PDF dicetak).
-- NULL = belum pernah dicetak.
alter table public.books add column if not exists label_printed_at timestamptz;

create index if not exists idx_books_label_printed on public.books (label_printed_at);

-- Selesai.
