import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isSuperadmin } from '@/lib/auth'
import { parseWorkbook } from '@/lib/excel'
import { nmPngrng, prtmJdl } from '@/lib/classification'
import { writeLog } from '@/lib/log'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await getSessionProfile()
  if (!isSuperadmin(session?.profile.role)) return NextResponse.json({ error: 'Hanya admin utama yang boleh import' }, { status: 403 })

  const fd = await request.formData()
  const file = fd.get('file') as File | null
  const mode = (fd.get('mode') as string) || 'preview'
  if (!file) return NextResponse.json({ error: 'File tidak ada' }, { status: 400 })

  const buf = await file.arrayBuffer()
  const parsed = parseWorkbook(buf)

  if (mode === 'preview') {
    return NextResponse.json({
      detectedFormat: parsed.detectedFormat, total: parsed.total,
      valid: parsed.valid, failed: parsed.failed
    })
  }

  const supabase = createClient()
  const rows = parsed.valid.map((v) => ({
    tanggal_terima: v.data.tanggal_terima || new Date().toISOString().slice(0, 10),
    judul_buku: v.data.judul_buku, pengarang: v.data.pengarang, penerbit: v.data.penerbit || null,
    tahun_terbit: v.data.tahun_terbit || null, jumlah_eksemplar: v.data.jumlah_eksemplar || 1,
    subjek: v.data.subjek || null, sumber: v.data.sumber || null, keterangan: v.data.keterangan || null,
    nomor_klasifikasi: v.data.nomor_klasifikasi || null,
    nm_pngrng: v.data.nm_pngrng || nmPngrng(v.data.pengarang || ''),
    prtm_jdl: v.data.prtm_jdl || prtmJdl(v.data.judul_buku || ''),
    // Kolom tambahan dari Excel (jika ada): cover, perjenjangan, isbn
    cover_url: v.data.cover_url || null,
    perjenjangan: v.data.perjenjangan || null,
    isbn: v.data.isbn || null,
    input_method: 'import', created_by: session!.userId
  }))

  let inserted = 0
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100)
    const { error, count } = await supabase.from('books').insert(chunk, { count: 'exact' })
    if (error) return NextResponse.json({ error: error.message, inserted }, { status: 500 })
    inserted += count || chunk.length
  }
  await writeLog(supabase, { userId: session!.userId, username: session!.profile.username, action: 'import', judul: `Import ${inserted} buku` })
  return NextResponse.json({ inserted })
}
