import { NextResponse } from 'next/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { readCovers } from '@/lib/gemini'

export const maxDuration = 60

export async function POST(request: Request) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  try {
    const { images } = await request.json()
    if (!Array.isArray(images) || images.length === 0) return NextResponse.json({ error: 'Tidak ada gambar' }, { status: 400 })
    const data = await readCovers(images)
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
