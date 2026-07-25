import { NextResponse } from 'next/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { searchCoverByTitle } from '@/lib/coverSearch'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Cari gambar cover berdasarkan judul (+ pengarang) di seluruh web. Khusus staff.
export async function GET(request: Request) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const sp = new URL(request.url).searchParams
  const title = sp.get('title') || ''
  const author = sp.get('author') || ''
  if (!title.trim()) return NextResponse.json({ error: 'Judul kosong' }, { status: 400 })
  try {
    const result = await searchCoverByTitle(title, author)
    return NextResponse.json({ data: result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
