'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// Daftar TANPA cover (kotak warna + inisial). Cover hanya di halaman detail.
const TILE = ['from-rose-400 to-orange-400', 'from-sky-400 to-indigo-400', 'from-emerald-400 to-teal-400', 'from-violet-400 to-fuchsia-400', 'from-amber-400 to-orange-500', 'from-cyan-400 to-blue-400', 'from-fuchsia-400 to-pink-400', 'from-teal-400 to-emerald-500']

interface Row {
  id: string; judul_buku: string; pengarang: string; penerbit: string | null
  tahun_terbit: string | null; nomor_inventaris: string | null
  nomor_klasifikasi: string | null; isbn: string | null
}

export default function KatalogPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyNoDdc, setOnlyNoDdc] = useState(false)

  // Aktifkan filter otomatis bila dibuka dari kartu dashboard (?ddc=kosong)
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ddc') === 'kosong') {
      setOnlyNoDdc(true)
    }
  }, [])

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

  const noDdc = (b: Row) => !b.nomor_klasifikasi || String(b.nomor_klasifikasi).trim() === ''
  const shown = onlyNoDdc ? rows.filter(noDdc) : rows
  const totalNoDdc = rows.filter(noDdc).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl text-slate-800">Katalog Buku</h1>
        <p className="text-sm text-slate-500">Cari berdasarkan judul, pengarang, ISBN, nomor inventaris, atau nomor klasifikasi.</p>
      </div>

      <div className="sticky top-[61px] z-10 -mx-1 space-y-2 bg-[#f4f5fb] px-1 py-2">
        <input className="input" placeholder="🔍 Ketik kata kunci..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOnlyNoDdc((v) => !v)}
            className={onlyNoDdc ? 'chip bg-amber-500 text-white' : 'chip border border-amber-300 bg-amber-50 text-amber-700'}
            style={{ maxWidth: 'none' }}
          >
            {onlyNoDdc ? '✓ ' : ''}Belum ada DDC ({totalNoDdc})
          </button>
          {onlyNoDdc && <span className="text-xs text-slate-400">Menampilkan hanya buku tanpa Nomor Klasifikasi.</span>}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat...</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-slate-400">Tidak ada buku yang cocok.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((b, i) => (
            <Link key={b.id} href={`/buku/${b.id}`} className="card flex gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${TILE[i % TILE.length]} text-xl font-extrabold text-white`}>
                {(b.judul_buku || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">{b.judul_buku}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{b.pengarang || 'Tanpa pengarang'}</p>
                <p className="mt-1 truncate text-[11px] text-slate-400">No. {b.nomor_inventaris}{b.nomor_klasifikasi ? ' · Klas. ' + b.nomor_klasifikasi : ''}</p>
                {noDdc(b) && <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Belum ada DDC</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
