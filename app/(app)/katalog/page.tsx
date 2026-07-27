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

const blank = (v: any) => !v || String(v).trim() === ''

export default function KatalogPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [onlyNoDdc, setOnlyNoDdc] = useState(false)
  const [onlyIncomplete, setOnlyIncomplete] = useState(false)
  // Mode kelola: pilih banyak buku untuk dihapus / dicetak labelnya sekaligus
  const [manage, setManage] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    if (p.get('ddc') === 'kosong') setOnlyNoDdc(true)
    if (p.get('info') === 'kurang') setOnlyIncomplete(true)
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

  const noDdc = (b: Row) => blank(b.nomor_klasifikasi)
  const incomplete = (b: Row) => blank(b.nomor_klasifikasi) || blank(b.penerbit) || blank(b.tahun_terbit) || blank(b.pengarang)
  const missingList = (b: Row) => {
    const m: string[] = []
    if (blank(b.nomor_klasifikasi)) m.push('DDC')
    if (blank(b.penerbit)) m.push('Penerbit')
    if (blank(b.tahun_terbit)) m.push('Tahun')
    if (blank(b.pengarang)) m.push('Pengarang')
    return m
  }

  let shown = rows
  if (onlyNoDdc) shown = shown.filter(noDdc)
  if (onlyIncomplete) shown = shown.filter(incomplete)
  const totalNoDdc = rows.filter(noDdc).length
  const totalIncomplete = rows.filter(incomplete).length

  // --- Seleksi ---
  function toggle(id: string) {
    setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const allShownSelected = shown.length > 0 && shown.every((b) => sel.has(b.id))
  function selectAllShown() {
    setSel((s) => {
      const n = new Set(s)
      if (allShownSelected) shown.forEach((b) => n.delete(b.id)) // toggle off
      else shown.forEach((b) => n.add(b.id))
      return n
    })
  }
  function clearSel() { setSel(new Set()) }

  function printLabels() {
    if (sel.size === 0) return
    window.location.href = '/label?ids=' + [...sel].join(',')
  }

  async function deleteSelected() {
    if (sel.size === 0) return
    if (!confirm(`Hapus ${sel.size} buku terpilih? Tindakan ini tercatat di riwayat dan tidak bisa dibatalkan.`)) return
    setBusy(true)
    const res = await fetch('/api/books/bulk-delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...sel] })
    })
    setBusy(false)
    if (!res.ok) { alert('Gagal menghapus.'); return }
    clearSel()
    load(q)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl text-slate-800">Katalog Buku</h1>
          <p className="text-sm text-slate-500">Cari berdasarkan judul, pengarang, ISBN, nomor inventaris, atau nomor klasifikasi.</p>
        </div>
        <button onClick={() => { setManage((m) => !m); clearSel() }} className={manage ? 'btn-primary' : 'btn-outline'}>
          {manage ? 'Selesai' : '☑️ Kelola'}
        </button>
      </div>

      <div className="sticky top-[61px] z-10 -mx-1 space-y-2 bg-[#f4f5fb] px-1 py-2">
        <input className="input" placeholder="🔍 Ketik kata kunci..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setOnlyIncomplete((v) => !v)}
            className={onlyIncomplete ? 'chip bg-orange-500 text-white' : 'chip border border-orange-300 bg-orange-50 text-orange-700'}
            style={{ maxWidth: 'none' }}>
            {onlyIncomplete ? '✓ ' : ''}Info belum lengkap ({totalIncomplete})
          </button>
          <button onClick={() => setOnlyNoDdc((v) => !v)}
            className={onlyNoDdc ? 'chip bg-amber-500 text-white' : 'chip border border-amber-300 bg-amber-50 text-amber-700'}
            style={{ maxWidth: 'none' }}>
            {onlyNoDdc ? '✓ ' : ''}Belum ada DDC ({totalNoDdc})
          </button>
        </div>
      </div>

      {/* Bar aksi mode kelola */}
      {manage && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <button onClick={selectAllShown} className="btn-outline px-3 py-1.5 text-xs">
            {allShownSelected ? 'Batalkan semua' : `Pilih semua (${shown.length})`}
          </button>
          <button onClick={clearSel} disabled={sel.size === 0} className="btn-outline px-3 py-1.5 text-xs">Kosongkan</button>
          <span className="text-sm text-slate-500">{sel.size} dipilih</span>
          <div className="ml-auto flex gap-2">
            <button onClick={printLabels} disabled={sel.size === 0} className="btn-outline px-3 py-1.5 text-xs">🖨️ Cetak label ({sel.size})</button>
            <button onClick={deleteSelected} disabled={sel.size === 0 || busy} className="btn-danger px-3 py-1.5 text-xs">{busy ? 'Menghapus...' : `🗑️ Hapus (${sel.size})`}</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat...</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-slate-400">Tidak ada buku yang cocok.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((b, i) => {
            const miss = missingList(b)
            const checked = sel.has(b.id)
            const inner = (
              <>
                {manage && (
                  <input type="checkbox" checked={checked} readOnly
                    className="mt-1 h-4 w-4 shrink-0 accent-brand-600" />
                )}
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${TILE[i % TILE.length]} text-xl font-extrabold text-white`}>
                  {(b.judul_buku || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">{b.judul_buku}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{b.pengarang || 'Tanpa pengarang'}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-400">No. {b.nomor_inventaris}{b.nomor_klasifikasi ? ' · Klas. ' + b.nomor_klasifikasi : ''}</p>
                  {miss.length > 0 && (
                    <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Belum: {miss.join(', ')}</span>
                  )}
                </div>
              </>
            )
            const cls = `card flex gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md ${manage && checked ? 'border-brand-400 ring-2 ring-brand-200' : ''}`
            return manage ? (
              <div key={b.id} onClick={() => toggle(b.id)} className={cls + ' cursor-pointer'}>{inner}</div>
            ) : (
              <Link key={b.id} href={`/buku/${b.id}`} className={cls}>{inner}</Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
