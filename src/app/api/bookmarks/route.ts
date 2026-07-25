import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET: daftar bookmark milik user yang login
export async function GET() {
  const session = await getSessionProfile()
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 })
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookmarks')
    .select('book_id, created_at, books ( id, judul_buku, pengarang, penerbit, tahun_terbit, nomor_inventaris, nomor_klasifikasi, cover_url )')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST: tambah bookmark { book_id }
export async function POST(request: Request) {
  const session = await getSessionProfile()
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 })
  const { book_id } = await request.json().catch(() => ({}))
  if (!book_id) return NextResponse.json({ error: 'book_id kosong' }, { status: 400 })
  const supabase = createClient()
  const { error } = await supabase.from('bookmarks').insert({ user_id: session.userId, book_id })
  if (error && !/(duplicate|unique)/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

// DELETE: hapus bookmark ?book_id=...
export async function DELETE(request: Request) {
  const session = await getSessionProfile()
  if (!session) return NextResponse.json({ error: 'Harus login' }, { status: 401 })
  const bookId = new URL(request.url).searchParams.get('book_id')
  if (!bookId) return NextResponse.json({ error: 'book_id kosong' }, { status: 400 })
  const supabase = createClient()
  const { error } = await supabase.from('bookmarks').delete().eq('user_id', session.userId).eq('book_id', bookId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
