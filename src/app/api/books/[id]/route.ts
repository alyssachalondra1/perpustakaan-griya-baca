import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import { nmPngrng, prtmJdl } from '@/lib/classification'
import { writeLog } from '@/lib/log'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data, error } = await supabase.from('books').select('*').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const supabase = createClient()
  const body = await request.json()
  const { data: before } = await supabase.from('books').select('*').eq('id', params.id).single()

  const update: any = {
    judul_buku: body.judul_buku, pengarang: body.pengarang, penerbit: body.penerbit,
    tahun_terbit: body.tahun_terbit ? String(body.tahun_terbit) : null,
    jumlah_eksemplar: Number(body.jumlah_eksemplar) || 1,
    subjek: body.subjek || null, sumber: body.sumber || null, keterangan: body.keterangan || null,
    nomor_klasifikasi: body.nomor_klasifikasi || null,
    nm_pngrng: body.nm_pngrng || nmPngrng(body.pengarang || ''),
    prtm_jdl: body.prtm_jdl || prtmJdl(body.judul_buku || ''),
    perjenjangan: body.perjenjangan || null, isbn: body.isbn || null,
    cover_url: body.cover_url || null, deskripsi: body.deskripsi || null
  }
  const { data, error } = await supabase.from('books').update(update).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await writeLog(supabase, { userId: session!.userId, username: session!.profile.username, action: 'update', recordId: data.id, judul: data.judul_buku, before, after: data })
  return NextResponse.json({ data })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionProfile()
  if (!isStaff(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const supabase = createClient()
  const { data: before } = await supabase.from('books').select('*').eq('id', params.id).single()
  const { error } = await supabase.from('books').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await writeLog(supabase, { userId: session!.userId, username: session!.profile.username, action: 'delete', recordId: params.id, judul: before?.judul_buku, before })
  return NextResponse.json({ ok: true })
}
