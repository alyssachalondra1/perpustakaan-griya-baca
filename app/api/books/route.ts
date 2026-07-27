import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { nmPngrng, prtmJdl } from '@/lib/classification'
import { writeLog } from '@/lib/log'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Daftar untuk katalog admin - kolom ringan saja (TANPA deskripsi & cover_url
// yang berat) supaya query cepat & tidak timeout saat buku sudah banyak.
const LIST_COLS =
  'id, tanggal_terima, nomor_inventaris, judul_buku, pengarang, penerbit, tahun_terbit, jumlah_eksemplar, subjek, sumber, keterangan, nomor_klasifikasi, nm_pngrng, prtm_jdl, perjenjangan, isbn, label_printed_at, input_method, created_at'

export async function GET(request: Request) {
  const supabase = createClient()
  const search = new URL(request.url).searchParams.get('search')?.trim() || ''

  const PAGE = 500
  const all: any[] = []
  try {
    for (let from = 0; ; from += PAGE) {
      let q = supabase.from('books').select(LIST_COLS).order('created_at', { ascending: false }).range(from, from + PAGE - 1)
      if (search) {
        const like = `%${search}%`
        q = q.or([
          `judul_buku.ilike.${like}`, `pengarang.ilike.${like}`, `isbn.ilike.${like}`,
          `nomor_inventaris.ilike.${like}`, `nomor_klasifikasi.ilike.${like}`
        ].join(','))
      }
      const { data, error } = await q
      if (error) throw new Error(error.message)
      if (data && data.length) all.push(...data)
      if (!data || data.length < PAGE) break
      if (all.length > 100000) break
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
  return NextResponse.json({ data: all })
}

export async function POST(request: Request) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const supabase = createClient()
  const body = await request.json()

  const insert = {
    tanggal_terima: body.tanggal_terima || new Date().toISOString().slice(0, 10),
    judul_buku: body.judul_buku,
    pengarang: body.pengarang,
    penerbit: body.penerbit,
    tahun_terbit: body.tahun_terbit ? String(body.tahun_terbit) : null,
    jumlah_eksemplar: Number(body.jumlah_eksemplar) || 1,
    subjek: body.subjek || null,
    sumber: body.sumber || null,
    keterangan: body.keterangan || null,
    nomor_klasifikasi: body.nomor_klasifikasi || null,
    nm_pngrng: body.nm_pngrng || nmPngrng(body.pengarang || ''),
    prtm_jdl: body.prtm_jdl || prtmJdl(body.judul_buku || ''),
    perjenjangan: body.perjenjangan || null,
    isbn: body.isbn || null,
    cover_url: body.cover_url || null,
    deskripsi: body.deskripsi || null,
    input_method: body.input_method || 'manual',
    created_by: session!.userId
  }

  const { data, error } = await supabase.from('books').insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await writeLog(supabase, { userId: session!.userId, username: session!.profile.username, action: 'create', recordId: data.id, judul: data.judul_buku, after: data })
  return NextResponse.json({ data })
}
