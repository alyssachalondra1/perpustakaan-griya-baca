# PANDUAN LENGKAP DARI NOL - Perpustakaan Griya Baca

Panduan ini ditulis untuk pemula. Ikuti berurutan dari atas ke bawah. Semua yang perlu Anda ketik/klik sudah dituliskan.

---

## DAFTAR ISI
1. Persiapan komputer (install tools)
2. Membuat akun-akun yang dibutuhkan
3. Menyiapkan Supabase (database + login)
4. Menyiapkan API Google Books & Gemini
5. Menjalankan aplikasi di komputer (lokal)
6. Membuat akun admin awal (seed)
7. Deploy ke internet (Vercel)
8. Memasang domain dari Rumahweb
9. Menghubungkan Login Google ke domain final
10. Pengujian akhir & pemakaian harian

---

## TAHAP 1 - PERSIAPAN KOMPUTER

1. **Install Node.js** (versi 18 atau lebih baru)
   - Buka https://nodejs.org -> unduh versi "LTS" -> install (klik Next sampai selesai).
   - Cek berhasil: buka Terminal / Command Prompt, ketik:
     ```bash
     node -v
     npm -v
     ```
     Kalau muncul angka versi, berarti sudah terpasang.

2. **Install VS Code** (editor kode) dari https://code.visualstudio.com (opsional tapi disarankan).

3. **Ekstrak project**: unzip `perpustakaan-griya-baca.zip`. Buka foldernya di VS Code (File > Open Folder).

4. **Buka terminal di dalam VS Code**: menu Terminal > New Terminal. Semua perintah di bawah dijalankan di sini.

---

## TAHAP 2 - MEMBUAT AKUN YANG DIBUTUHKAN

Buat akun gratis di layanan berikut (cukup pakai email Anda):
- **Supabase** -> https://supabase.com (database + login)
- **Google Cloud** -> https://console.cloud.google.com (untuk API Books, Gemini, Login Google)
- **Vercel** -> https://vercel.com (hosting gratis)
- **GitHub** -> https://github.com (untuk menyimpan kode & connect ke Vercel)
- **Rumahweb** -> tempat Anda membeli domain `perpustakaankkn298.my.id`

---

## TAHAP 3 - MENYIAPKAN SUPABASE

1. Login ke https://supabase.com -> **New Project**.
   - Name: `perpustakaan-griya-baca`
   - Database Password: buat password kuat, **catat baik-baik**.
   - Region: pilih **Southeast Asia (Singapore)**.
   - Klik **Create new project**, tunggu ~2 menit.

2. **Ambil kunci API**: menu kiri **Project Settings** (ikon gerigi) > **API**. Catat:
   - `Project URL`  -> untuk `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public`  -> untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` -> untuk `SUPABASE_SERVICE_ROLE_KEY` (RAHASIA, jangan dibagikan)

3. **Buat tabel database**: menu kiri **SQL Editor** > **New query**.
   - Buka file `supabase/schema.sql` dari project, **salin SELURUH isinya**, tempel ke editor, klik **Run**.
   - Kalau muncul "Success", database sudah siap.

4. **Aktifkan Login Google** (untuk pengunjung):
   - Menu **Authentication** > **Providers** > **Google** > aktifkan.
   - Isian Client ID & Secret didapat di TAHAP 4B. Untuk sekarang biarkan dulu, kita isi nanti.
   - Catat juga **Callback URL** yang ditampilkan Supabase, bentuknya:
     `https://<PROJECT-REF>.supabase.co/auth/v1/callback`

---

## TAHAP 4 - API GOOGLE BOOKS & GEMINI

### 4A. Google Books API (untuk scan ISBN)
1. Buka https://console.cloud.google.com -> buat Project baru: `perpustakaan-griyabaca`.
2. Menu **APIs & Services** > **Library** > cari **Books API** > **Enable**.
3. Menu **APIs & Services** > **Credentials** > **Create Credentials** > **API key**.
4. Salin API key -> untuk `GOOGLE_BOOKS_API_KEY`.

### 4B. Google Gemini API (untuk Scan Cover / AI Vision)
1. Buka https://aistudio.google.com/app/apikey (Google AI Studio).
2. Klik **Create API key** -> pilih project tadi -> salin key.
3. Simpan -> untuk `GEMINI_API_KEY`. (Gratis di free tier, model `gemini-1.5-flash`.)

### 4C. Login Google (OAuth) untuk pengunjung
1. Di Google Cloud > **APIs & Services** > **OAuth consent screen**:
   - User type: **External** > isi nama app "Perpustakaan Griya Baca", email Anda > Save.
   - Di bagian Test users, tambahkan email Anda (sementara, sebelum publish).
2. **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized redirect URIs**: tambahkan Callback URL Supabase dari TAHAP 3.4:
     `https://<PROJECT-REF>.supabase.co/auth/v1/callback`
   - Klik Create -> salin **Client ID** dan **Client Secret**.
3. Kembali ke **Supabase > Authentication > Providers > Google**, tempel Client ID & Secret, **Save**.

---

## TAHAP 5 - MENJALANKAN DI KOMPUTER (LOKAL)

1. Di terminal (dalam folder project), install dependency:
   ```bash
   npm install
   ```
2. Buat file konfigurasi rahasia: salin contoh lalu isi:
   ```bash
   cp .env.local.example .env.local
   ```
   Buka `.env.local`, isi sesuai yang Anda catat:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   GOOGLE_BOOKS_API_KEY=...
   GEMINI_API_KEY=...
   NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN=griyabaca.local
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
3. Jalankan:
   ```bash
   npm run dev
   ```
   Buka browser ke http://localhost:3000

---

## TAHAP 6 - MEMBUAT AKUN ADMIN AWAL (SEED)

Di terminal (biarkan npm run dev berjalan di tab lain, atau hentikan dulu):
```bash
npm run seed
```
Ini membuat:
- **superadmin** / `SuperAdmin123!` (Admin Utama - bisa semua)
- **admin01** ... **admin08** / `Admin123!` (Admin biasa)

> PENTING: Setelah login pertama, ganti password default lewat menu **Kelola Admin** (khusus superadmin).

Login admin lewat halaman **Masuk sebagai Admin**, cukup ketik username (mis. `superadmin`), tanpa email.

---

## TAHAP 7 - DEPLOY KE INTERNET (VERCEL)

1. Buat repository di **GitHub** (mis. `perpustakaan-griya-baca`), upload project ke sana:
   ```bash
   git init
   git add .
   git commit -m "init perpustakaan griya baca"
   git branch -M main
   git remote add origin https://github.com/USERNAME/perpustakaan-griya-baca.git
   git push -u origin main
   ```
2. Buka https://vercel.com > **Add New** > **Project** > **Import** repo GitHub tadi.
3. Di halaman konfigurasi, buka **Environment Variables**, masukkan SEMUA variabel dari `.env.local` (kecuali ubah yang ini):
   - `NEXT_PUBLIC_SITE_URL` = `https://perpustakaankkn298.my.id`
4. Klik **Deploy**, tunggu selesai. Anda akan dapat alamat sementara `xxxx.vercel.app`.

---

## TAHAP 8 - MEMASANG DOMAIN DARI RUMAHWEB

1. Di project Vercel > **Settings** > **Domains** > ketik `perpustakaankkn298.my.id` > **Add**.
2. Vercel akan menampilkan data DNS yang harus dipasang. Umumnya:
   - **A record**: host `@` -> nilai `76.76.21.21`
   - **CNAME**: host `www` -> nilai `cname.vercel-dns.com`
3. Login ke **Rumahweb** > kelola domain `perpustakaankkn298.my.id` > menu **DNS Management / Kelola DNS**:
   - Tambah **A record**: Name `@`, Value `76.76.21.21`.
   - Tambah **CNAME**: Name `www`, Value `cname.vercel-dns.com`.
   - Simpan. Tunggu propagasi (bisa 5 menit - beberapa jam).
4. Kembali ke Vercel Domains, tunggu status menjadi **Valid** (centang hijau). SSL otomatis aktif.

> Ikuti persis nilai yang ditampilkan Vercel bila berbeda dengan contoh di atas.

---

## TAHAP 9 - MENGHUBUNGKAN LOGIN GOOGLE KE DOMAIN FINAL

1. Di **Supabase > Authentication > URL Configuration**:
   - **Site URL**: `https://perpustakaankkn298.my.id`
   - **Redirect URLs**: tambahkan `https://perpustakaankkn298.my.id/auth/callback`
2. (Google OAuth redirect URI tetap yang milik Supabase - tidak perlu diubah.)
3. Bila OAuth consent screen masih "Testing", tekan **Publish App** agar semua orang bisa login Google.

---

## TAHAP 10 - PENGUJIAN AKHIR & PEMAKAIAN HARIAN

Uji lewat **HP** dan **laptop** (tampilan otomatis menyesuaikan):
- [ ] Buka domain, muncul 2 pilihan login (Admin / Pengunjung).
- [ ] Login admin (`superadmin`) berhasil masuk dashboard.
- [ ] **Tambah Buku > Scan ISBN**: arahkan kamera HP ke barcode, data terisi otomatis.
- [ ] **Scan Cover**: foto sampul depan/belakang, AI mengisi data.
- [ ] **Input Manual**: semua field wajib harus terisi baru bisa disimpan.
- [ ] Nomor Inventaris muncul otomatis & berurutan.
- [ ] **Katalog**: cari buku by judul/pengarang/ISBN.
- [ ] **Cetak Label**: pilih buku > Unduh DOCX / Cetak PDF.
- [ ] **Export Excel**: unduh format TBM (10 kolom) & FIX (13 kolom), cek urutan kolom.
- [ ] **Import Excel**: unggah file contoh, pratinjau, lalu impor.
- [ ] Login Google sebagai pengunjung: hanya bisa lihat & cari (tidak bisa edit).

### Catatan penjelasan (Tahap desain sistem)
- **Tampilan (UI/UX)**: mobile-first. Di HP muncul menu "hamburger" (drawer), tombol besar untuk scan; di laptop muncul sidebar tetap dan grid katalog beberapa kolom. Semua halaman dioptimalkan untuk kamera HP (scan ISBN & cover).
- **Alur sistem**:
  1. Admin menambah buku (ISBN/Cover/Manual) -> data tersimpan di Supabase, Nomor Inventaris dibuat otomatis oleh database.
  2. Kode label (NM-PNGRNG dari nama belakang pengarang, PRTM JDL dari huruf pertama judul) dihitung otomatis + saran DDC.
  3. Pengunjung (login Google) hanya membaca katalog.
  4. Export menghasilkan 2 file Excel sesuai standar Perpusnas; Import membaca kedua format.
  5. Setiap perubahan tercatat di Riwayat Perubahan.

### Masalah umum
- **Kamera tidak jalan**: situs harus dibuka via **https** (domain final sudah https). Izinkan akses kamera di browser.
- **Login Google gagal**: cek Redirect URLs di Supabase & pastikan OAuth consent "Published".
- **Import gagal**: pastikan baris header Excel sama persis dengan format TBM/FIX.

Selamat! Sistem inventaris Perpustakaan Griya Baca siap digunakan.
