import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isSuperadmin } from '@/lib/auth'
import { searchCoverByTitle } from '@/lib/coverSearch'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Ambil cover otomatis untuk buku yang cover_url-nya MASIH NULL.
// Diproses per-batch kecil supaya tidak melewati batas waktu server.
// - Ketemu  -> cover_url diisi URL gambar.
// - Tidak   -> cover_url diisi '' (string kosong) sebagai penanda "sudah dicoba",
//              agar tidak diproses ulang terus-menerus. '' tetap tampil sbg
//              "tanpa cover" di UI (nilai falsy).
const BATCH = 12

export async function POST() {
  const session = await getSessionProfile()
  if (!isSuperadmin(session?.profile.role)) {
    return NextResponse.json({ error: 'Hanya admin utama yang boleh menjalankan ini' }, { status: 403 })
  }
  const supabase = createClient()

  const { data: batch, error } = await supabase
    .from('books')
    .select('id, judul_buku, pengarang')
    .is('cover_url', null)
    .limit(BATCH)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let found = 0
  for (const b of batch || []) {
    let url = ''
    try {
      const r = await searchCoverByTitle(b.judul_buku || '', b.pengarang || '')
      if (r && r.cover_url) { url = r.cover_url; found++ }
    } catch { /* biarkan kosong, tandai sudah dicoba */ }
    await supabase.from('books').update({ cover_url: url }).eq('id', b.id)
  }

  const { count: remaining } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .is('cover_url', null)

  return NextResponse.json({ processed: (batch || []).length, found, remaining: remaining || 0 })
}

// Info jumlah buku yang belum punya cover (untuk tampilan awal).
export async function GET() {
  const session = await getSessionProfile()
  if (!isSuperadmin(session?.profile.role)) {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  }
  const supabase = createClient()
  const { count } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .is('cover_url', null)
  return NextResponse.json({ remaining: count || 0 })
}
