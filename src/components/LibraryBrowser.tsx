'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const COLORS = ['bg-rose-400', 'bg-amber-400', 'bg-sky-400', 'bg-violet-400', 'bg-emerald-400', 'bg-orange-400', 'bg-teal-400', 'bg-fuchsia-400', 'bg-cyan-400', 'bg-lime-500']

interface Row {
  id: string; judul_buku: string; pengarang: string; penerbit: string | null
  tahun_terbit: string | null; nomor_inventaris: string | null
  nomor_klasifikasi: string | null; subjek: string | null; perjenjangan: string | null; cover_url: string | null
}

export default function LibraryBrowser() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (term: string) => {
    setLoading(true)
    const res = await fetch('/api/public-books?search=' + encodeURIComponent(term))
    const json = await res.json()
    setRows(json.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(q), 300)
    return () => clearTimeout(t)
  }, [q, load])

  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-xl">
        <input className="input text-base" placeholder="🔍 Cari judul, pengarang, subjek..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-center text-sm text-slate-400">Memuat koleksi...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-400">Belum ada buku yang cocok 📭</div>
      ) : (
        <>
          <p className="text-center text-sm font-semibold text-slate-500">{rows.length} buku ditemukan</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rows.map((b, i) => (
              <Link key={b.id} href={`/buku/${b.id}`} className="group flex flex-col overflow-hidden rounded-3xl border-2 border-slate-100 bg-white transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg">
                <div className={`flex h-40 items-center justify-center overflow-hidden ${COLORS[i % COLORS.length]}`}>
                  {b.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-3 text-center font-display text-sm font-bold leading-snug text-white line-clamp-4">{b.judul_buku}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="line-clamp-2 text-sm font-bold text-slate-800">{b.judul_buku}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{b.pengarang}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {b.perjenjangan && <span className="chip bg-brand-100 text-brand-700">{b.perjenjangan}</span>}
                    {b.subjek && <span className="chip max-w-full bg-sky-100 text-sky-700"><span className="line-clamp-1">{b.subjek}</span></span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
