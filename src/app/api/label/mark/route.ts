import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Tandai / batalkan tanda "sudah dicetak" untuk sekumpulan buku (khusus staff).
// body: { ids: string[], printed: boolean }
export async function POST(request: Request) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: any) => typeof x === 'string') : []
  const printed = body.printed !== false // default true
  if (ids.length === 0) return NextResponse.json({ error: 'Tidak ada buku dipilih' }, { status: 400 })

  const supabase = createClient()
  const value = printed ? new Date().toISOString() : null
  const { error } = await supabase.from('books').update({ label_printed_at: value }).in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: ids.length, label_printed_at: value })
}
