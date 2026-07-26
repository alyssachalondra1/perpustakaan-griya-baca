import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Daftar buku PUBLIK - bisa diakses tanpa login (untuk halaman perpustakaan).
// Menampilkan SEMUA buku (termasuk yang infonya belum lengkap). Tanda "belum
// lengkap" hanya ada di sisi admin, bukan di tampilan pengunjung.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const search = (new URL(request.url).searchParams.get('search') || '').trim()

  let query = supabase
    .from('books')
    .select('id, judul_buku, pengarang, penerbit, tahun_terbit, nomor_inventaris, nomor_klasifikasi, subjek, perjenjangan, isbn, cover_url')
    .order('created_at', { ascending: false })
    .limit(2000)

  if (search) {
    const like = `%${search}%`
    query = query.or(
      `judul_buku.ilike.${like},pengarang.ilike.${like},penerbit.ilike.${like},isbn.ilike.${like},nomor_inventaris.ilike.${like},nomor_klasifikasi.ilike.${like},subjek.ilike.${like}`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
