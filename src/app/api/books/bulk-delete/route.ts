import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { writeLog } from '@/lib/log'

export const dynamic = 'force-dynamic'

// Hapus banyak buku sekaligus (khusus staff/admin).
export async function POST(request: Request) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: any) => typeof x === 'string') : []
  if (ids.length === 0) return NextResponse.json({ error: 'Tidak ada buku dipilih' }, { status: 400 })

  const supabase = createClient()
  const { error } = await supabase.from('books').delete().in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeLog(supabase, {
    userId: session!.userId, username: session!.profile.username,
    action: 'delete', judul: `Hapus massal ${ids.length} buku`
  })
  return NextResponse.json({ deleted: ids.length })
}
