'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface Row { id: string; judul_buku: string; nomor_klasifikasi: string | null; nm_pngrng: string | null; prtm_jdl: string | null }

function LabelInner() {
  const params = useSearchParams()
  const preIds = (params.get('ids') || '').split(',').filter(Boolean)
  const [rows, setRows] = useState<Row[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(preIds))
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/books').then((r) => r.json()).then((j) => { setRows(j.data || []); setLoading(false) })
  }, [])

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function selectAll() { setSelected(new Set(rows.map((r) => r.id))) }
  function clearAll() { setSelected(new Set()) }

  async function download() {
    if (selected.size === 0) return
    setBusy(true)
    const res = await fetch('/api/label', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected] })
    })
    setBusy(false)
    if (!res.ok) { alert('Gagal membuat label.'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'label-buku.docx'; a.click()
    URL.revokeObjectURL(url)
  }

  const chosen = rows.filter((r) => selected.has(r.id))

  return (
    <div className="space-y-4">
      <div className="no-print">
        <h1 className="text-xl font-bold text-slate-800">Cetak Label Buku</h1>
        <p className="text-sm text-slate-500">Pilih buku, lalu unduh DOCX atau cetak langsung (PDF) dari sini.</p>
      </div>

      <div className="flex flex-wrap gap-2 no-print">
        <button onClick={selectAll} className="btn-outline px-3 py-1.5 text-xs">Pilih Semua</button>
        <button onClick={clearAll} className="btn-outline px-3 py-1.5 text-xs">Kosongkan</button>
        <button onClick={download} disabled={busy || selected.size === 0} className="btn-outline px-3 py-1.5 text-xs">⬇️ Unduh DOCX ({selected.size})</button>
        <button onClick={() => window.print()} disabled={selected.size === 0} className="btn-primary px-3 py-1.5 text-xs">🖨️ Cetak / PDF</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card no-print">
          <h2 className="mb-2 font-semibold text-slate-800">Daftar Buku</h2>
          {loading ? <p className="text-sm text-slate-400">Memuat...</p> : (
            <div className="max-h-[60vh] space-y-1 overflow-auto">
              {rows.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  <span className="flex-1 truncate">{r.judul_buku}</span>
                  <span className="text-xs text-slate-400">{r.nomor_klasifikasi || '-'}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-slate-800 no-print">Pratinjau Label</h2>
          <div className="grid grid-cols-3 gap-2">
            {chosen.map((r) => (
              <div key={r.id} className="flex flex-col items-center gap-0.5 border border-slate-800 p-2 text-center text-[10px] font-bold leading-tight">
                <span>PERPUSTAKAAN</span>
                <span>GRIYA BACA</span>
                <span className="text-xs">{r.nomor_klasifikasi || '-'}</span>
                <span className="text-xs">{r.nm_pngrng || '-'}</span>
                <span className="text-xs">{r.prtm_jdl || '-'}</span>
              </div>
            ))}
            {chosen.length === 0 && <p className="col-span-3 text-sm text-slate-400">Belum ada buku dipilih.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LabelPage() {
  return <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}><LabelInner /></Suspense>
}
