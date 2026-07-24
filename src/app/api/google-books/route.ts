import { NextResponse } from 'next/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { fetchByIsbn } from '@/lib/googleBooks'

export async function GET(request: Request) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const isbn = new URL(request.url).searchParams.get('isbn') || ''
  if (!isbn) return NextResponse.json({ error: 'ISBN kosong' }, { status: 400 })
  try {
    const data = await fetchByIsbn(isbn)
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
