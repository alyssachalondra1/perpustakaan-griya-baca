import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { buildWorkbook, type ExportFormat } from '@/lib/excel'
import { writeLog } from '@/lib/log'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const format = (new URL(request.url).searchParams.get('format') || 'tbm') as ExportFormat
  const supabase = createClient()
  const { data: books, error } = await supabase.from('books').select('*').order('nomor_inventaris', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const buf = buildWorkbook((books as any) || [], format)
  await writeLog(supabase, { userId: session!.userId, username: session!.profile.username, action: 'export', judul: `Export ${format.toUpperCase()}` })

  const filename = format === 'fix' ? 'Buku Inventaris FIX.xlsx' : 'Buku Inventaris Perpustakaan dan TBM.xlsx'
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
