# Perpustakaan Griya Baca - Sistem Inventaris

Aplikasi web inventaris buku untuk **Perpustakaan Griya Baca** (program KKN Literasi).
Dibangun agar mudah dipakai lewat **HP (scan barcode/cover)** maupun **laptop**.

## Fitur utama
- Login terpisah: **Admin** (username + password) & **Pengunjung** (Google).
- Tambah buku 3 cara: **Scan ISBN** (Google Books), **Scan Cover** (AI Gemini), **Input manual**.
- Nomor Inventaris **otomatis berurutan** (sesuai ketentuan Perpusnas), kolom **Perjenjangan** terpisah.
- Katalog + pencarian (judul, pengarang, ISBN, no. inventaris, no. klasifikasi).
- Cetak **label buku** (nomor panggil DDC + NM-PNGRNG + PRTM JDL) ke DOCX / PDF.
- **Export Excel 2 format**: TBM (10 kolom) & FIX (13 kolom) - urutan kolom persis sesuai file Perpusnas.
- **Import Excel** (deteksi format otomatis, pratinjau sebelum simpan).
- Kelola admin (buat akun, reset password, aktif/nonaktif) + **Riwayat perubahan**.
- Tampilan **responsif** (HP & laptop).

## Teknologi
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth, Postgres, RLS)
- Google Books API, Google Gemini API (AI Vision)
- xlsx (SheetJS) untuk Excel, docx untuk label

## Cara pakai singkat
1. `npm install`
2. Salin `.env.local.example` -> `.env.local`, isi semua kunci.
3. Jalankan isi `supabase/schema.sql` di Supabase SQL Editor.
4. `npm run seed` untuk membuat akun admin awal.
5. `npm run dev` lalu buka http://localhost:3000

**Panduan lengkap dari nol (bikin akun, API, deploy Vercel, domain Rumahweb) ada di `PANDUAN.md`.**

## Akun default (ganti setelah login!)
| Peran | Username | Password |
|---|---|---|
| Admin Utama | `superadmin` | `SuperAdmin123!` |
| Admin | `admin01` ... `admin08` | `Admin123!` |
