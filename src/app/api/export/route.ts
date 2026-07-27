import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { buildWorkbook, type ExportFormat } from '@/lib/excel'
import { writeLog } from '@/lib/log'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Kolom yang DIPERLUKAN export saja (TANPA cover_url & deskripsi yang berat).
// Ini yang bikin export sebelumnya timeout: select('*') ikut menarik deskripsi
// panjang hasil scan AI untuk ratusan buku sekaligus.
const COLS =
  'tanggal_terima,nomor_inventaris,judul_buku,pengarang,penerbit,tahun_terbit,jumlah_eksemplar,subjek,sumber,keterangan,nomor_klasifikasi,nm_pngrng,prtm_jdl'

// Ambil SEMUA buku secara BERTAHAP (per potongan) supaya tiap query kecil dan
// tidak kena statement timeout, berapa pun jumlah bukunya.
async function fetchAllBooks(supabase: ReturnType<typeof createClient>) {
  const PAGE = 300
  const all: any[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('books')
      .select(COLS)
      .order('nomor_inventaris', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    if (data && data.length) all.push(...data)
    if (!data || data.length < PAGE) break
    if (all.length > 100000) break // pengaman
  }
  return all
}

export async function GET(request: Request) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const format = (new URL(request.url).searchParams.get('format') || 'tbm') as ExportFormat
  const supabase = createClient()

  let books: any[]
  try {
    books = await fetchAllBooks(supabase)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  const buf = buildWorkbook(books, format)
  await writeLog(supabase, { userId: session!.userId, username: session!.profile.username, action: 'export', judul: `Export ${format.toUpperCase()} (${books.length} buku)` })

  const filename = format === 'fix' ? 'Buku Inventaris FIX.xlsx' : 'Buku Inventaris Perpustakaan dan TBM.xlsx'
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
