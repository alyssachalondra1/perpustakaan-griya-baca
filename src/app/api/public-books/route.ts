import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Daftar buku PUBLIK - bisa diakses tanpa login (untuk halaman perpustakaan).
// Menampilkan SEMUA buku (termasuk yang infonya belum lengkap). Tanda "belum
// lengkap" hanya ada di sisi admin, bukan di tampilan pengunjung.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const COLS =
  'id, judul_buku, pengarang, penerbit, tahun_terbit, nomor_inventaris, nomor_klasifikasi, subjek, perjenjangan, isbn, cover_url'

// Ambil data BERTAHAP per potongan kecil supaya tidak kena statement timeout
// walau jumlah buku banyak (ini sebab tampilan pengunjung sempat kosong).
export async function GET(request: Request) {
  const supabase = createClient()
  const search = (new URL(request.url).searchParams.get('search') || '').trim()

  const PAGE = 500
  const all: any[] = []
  try {
    for (let from = 0; ; from += PAGE) {
      let query = supabase
        .from('books')
        .select(COLS)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1)

      if (search) {
        const like = `%${search}%`
        query = query.or(
          `judul_buku.ilike.${like},pengarang.ilike.${like},penerbit.ilike.${like},isbn.ilike.${like},nomor_inventaris.ilike.${like},nomor_klasifikasi.ilike.${like},subjek.ilike.${like}`
        )
      }

      const { data, error } = await query
      if (error) throw new Error(error.message)
      if (data && data.length) all.push(...data)
      if (!data || data.length < PAGE) break
      if (all.length > 100000) break // pengaman
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  return NextResponse.json({ data: all })
}
