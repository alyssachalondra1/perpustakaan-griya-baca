'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Row {
  id: string; judul_buku: string; pengarang: string; penerbit: string | null
  tahun_terbit: string | null; nomor_inventaris: string | null
  nomor_klasifikasi: string | null; isbn: string | null; cover_url: string | null
}

export default function KatalogPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (term: string) => {
    setLoading(true)
    const res = await fetch('/api/books?search=' + encodeURIComponent(term))
    const json = await res.json()
    setRows(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(q), 300)
    return () => clearTimeout(t)
  }, [q, load])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Katalog Buku</h1>
        <p className="text-sm text-slate-500">Cari berdasarkan judul, pengarang, ISBN, nomor inventaris, atau nomor klasifikasi.</p>
      </div>

      <div className="sticky top-[57px] z-10 bg-slate-50 py-2">
        <input className="input" placeholder="🔍 Ketik kata kunci..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400">Tidak ada buku yang cocok.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((b) => (
            <Link key={b.id} href={`/buku/${b.id}`} className="card flex gap-3 hover:border-brand-300 hover:shadow-md">
              {b.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.cover_url} alt="" className="h-24 w-16 shrink-0 rounded object-cover" />
              ) : (
                <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded bg-slate-100 text-2xl">📘</div>
              )}
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-slate-800">{b.judul_buku}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{b.pengarang}</p>
                <p className="mt-1 text-[11px] text-slate-400">No. {b.nomor_inventaris}</p>
                {b.nomor_klasifikasi && <p className="text-[11px] text-slate-400">Klas. {b.nomor_klasifikasi}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
