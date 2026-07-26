'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// Kartu daftar TANPA cover (karena tidak semua buku punya cover).
// Sebagai gantinya: kotak warna berisi inisial judul. Cover hanya tampil di halaman detail.
const TILE = ['from-rose-400 to-orange-400', 'from-sky-400 to-indigo-400', 'from-emerald-400 to-teal-400', 'from-violet-400 to-fuchsia-400', 'from-amber-400 to-orange-500', 'from-cyan-400 to-blue-400', 'from-fuchsia-400 to-pink-400', 'from-teal-400 to-emerald-500']

interface Row {
  id: string; judul_buku: string; pengarang: string; penerbit: string | null
  tahun_terbit: string | null; nomor_inventaris: string | null
  nomor_klasifikasi: string | null; subjek: string | null; perjenjangan: string | null
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
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">Belum ada buku yang cocok 📭</div>
      ) : (
        <>
          <p className="text-center text-sm font-semibold text-slate-500">{rows.length} buku ditemukan</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((b, i) => (
              <Link key={b.id} href={`/buku/${b.id}`}
                className="card flex gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${TILE[i % TILE.length]} text-xl font-extrabold text-white`}>
                  {(b.judul_buku || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">{b.judul_buku}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{b.pengarang || 'Tanpa pengarang'}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {b.perjenjangan && <span className="chip bg-brand-100 text-brand-700">{b.perjenjangan}</span>}
                    {b.subjek && <span className="chip bg-sky-100 text-sky-700">{b.subjek}</span>}
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
