import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { buildLabelDocx } from '@/lib/label'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const { ids } = await request.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: 'Tidak ada buku dipilih' }, { status: 400 })

  const supabase = createClient()
  const { data: books, error } = await supabase.from('books').select('*').in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: settings } = await supabase.from('library_settings').select('*').eq('id', 1).single()
  const buf = await buildLabelDocx((books as any) || [], settings?.nama_baris1, settings?.nama_baris2)

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="label-buku.docx"'
    }
  })
}
