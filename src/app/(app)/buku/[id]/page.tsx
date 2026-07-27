import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import DeleteButton from '@/components/DeleteButton'

export const dynamic = 'force-dynamic'

const FIELDS: { key: string; label: string }[] = [
  { key: 'nomor_inventaris', label: 'Nomor Inventaris' },
  { key: 'tanggal_terima', label: 'Tanggal Terima' },
  { key: 'pengarang', label: 'Pengarang' },
  { key: 'penerbit', label: 'Penerbit' },
  { key: 'tahun_terbit', label: 'Tahun Terbit' },
  { key: 'jumlah_eksemplar', label: 'Jumlah Eksemplar' },
  { key: 'subjek', label: 'Subjek' },
  { key: 'sumber', label: 'Sumber' },
  { key: 'nomor_klasifikasi', label: 'Nomor Klasifikasi' },
  { key: 'nm_pngrng', label: 'NM-PNGRNG' },
  { key: 'prtm_jdl', label: 'PRTM JDL' },
  { key: 'perjenjangan', label: 'Perjenjangan' },
  { key: 'isbn', label: 'ISBN' },
  { key: 'keterangan', label: 'Keterangan' }
]

export default async function BookDetail({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const session = await getSessionProfile()
  const { data: b } = await supabase.from('books').select('*').eq('id', params.id).single()
  if (!b) notFound()
  const staff = isStaff(session?.profile.role)

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/katalog" className="text-sm text-brand-700 hover:underline">&larr; Kembali ke katalog</Link>
        {staff && (
          <Link href="/tambah" className="btn-primary">📷 Lanjut Scan Buku Berikutnya</Link>
        )}
      </div>

      {staff && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          ✓ Buku berhasil disimpan. Klik <b>Lanjut Scan</b> untuk menambah buku berikutnya, atau edit data di bawah.
        </div>
      )}

      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row">
          {b.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.cover_url} alt="" className="mx-auto h-48 w-32 rounded object-cover sm:mx-0" />
          ) : (
            <div className="mx-auto flex h-48 w-32 items-center justify-center rounded bg-slate-100 text-4xl sm:mx-0">📘</div>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800">{b.judul_buku}</h1>
            {b.deskripsi && <p className="mt-2 text-sm text-slate-600">{b.deskripsi}</p>}
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex justify-between gap-3 border-b border-slate-100 py-1.5 text-sm">
              <dt className="text-slate-500">{f.label}</dt>
              <dd className="text-right font-medium text-slate-800">{(b as any)[f.key] || '-'}</dd>
            </div>
          ))}
        </dl>

        {staff && (
          <div className="mt-5 flex flex-wrap gap-2 no-print">
            <Link href={`/tambah?edit=${b.id}`} className="btn-outline">Edit</Link>
            <DeleteButton id={b.id} judul={b.judul_buku} />
            <Link href={`/label?ids=${b.id}`} className="btn-outline">Cetak Label</Link>
            <Link href="/tambah" className="btn-primary">📷 Lanjut Scan</Link>
          </div>
        )}
      </div>
    </div>
  )
}
