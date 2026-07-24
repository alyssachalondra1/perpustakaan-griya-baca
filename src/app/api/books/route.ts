import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { nmPngrng, prtmJdl } from '@/lib/classification'
import { writeLog } from '@/lib/log'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const search = new URL(request.url).searchParams.get('search')?.trim() || ''
  let q = supabase.from('books').select('*').order('created_at', { ascending: false })
  if (search) {
    const like = `%${search}%`
    q = q.or([
      `judul_buku.ilike.${like}`, `pengarang.ilike.${like}`, `isbn.ilike.${like}`,
      `nomor_inventaris.ilike.${like}`, `nomor_klasifikasi.ilike.${like}`
    ].join(','))
  }
  const { data, error } = await q.limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
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
