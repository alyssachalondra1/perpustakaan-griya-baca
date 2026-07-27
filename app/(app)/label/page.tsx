'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface Row {
  id: string; judul_buku: string; pengarang: string | null; penerbit: string | null
  tahun_terbit: string | null; nomor_klasifikasi: string | null
  nm_pngrng: string | null; prtm_jdl: string | null; perjenjangan: string | null
  label_printed_at: string | null
}

const blank = (v: any) => !v || String(v).trim() === ''
// Info lengkap = DDC, penerbit, tahun, pengarang terisi (sama dg definisi KPI)
const isComplete = (b: Row) => !blank(b.nomor_klasifikasi) && !blank(b.penerbit) && !blank(b.tahun_terbit) && !blank(b.pengarang)

function LabelInner() {
  const params = useSearchParams()
  const preIds = (params.get('ids') || '').split(',').filter(Boolean)
  const [rows, setRows] = useState<Row[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set(preIds))
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  // ---- Multiple filter ----
  const [q, setQ] = useState('')
  const [fCetak, setFCetak] = useState<'semua' | 'belum' | 'sudah'>('semua')
  const [fLengkap, setFLengkap] = useState<'semua' | 'lengkap' | 'belum'>('semua')
  const [fJenjang, setFJenjang] = useState('')

  useEffect(() => {
    fetch('/api/books').then((r) => r.json()).then((j) => { setRows(j.data || []); setLoading(false) })
  }, [])

  const jenjangOpts = useMemo(() => {
    const s = new Set<string>()
    rows.forEach((r) => { if (r.perjenjangan && r.perjenjangan.trim()) s.add(r.perjenjangan.trim()) })
    return [...s].sort()
  }, [rows])

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (term && !(`${r.judul_buku} ${r.pengarang || ''} ${r.nomor_klasifikasi || ''}`.toLowerCase().includes(term))) return false
      if (fCetak === 'belum' && r.label_printed_at) return false
      if (fCetak === 'sudah' && !r.label_printed_at) return false
      if (fLengkap === 'lengkap' && !isComplete(r)) return false
      if (fLengkap === 'belum' && isComplete(r)) return false
      if (fJenjang && (r.perjenjangan || '').trim() !== fJenjang) return false
      return true
    })
  }, [rows, q, fCetak, fLengkap, fJenjang])

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function selectShown() { setSelected((s) => { const n = new Set(s); shown.forEach((r) => n.add(r.id)); return n }) }
  function selectShownComplete() { setSelected((s) => { const n = new Set(s); shown.filter(isComplete).forEach((r) => n.add(r.id)); return n }) }
  function clearAll() { setSelected(new Set()) }

  // Tandai / batalkan tanda "sudah dicetak" & update tampilan lokal
  async function mark(ids: string[], printed: boolean) {
    if (ids.length === 0) return
    await fetch('/api/label/mark', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, printed })
    })
    const stamp = printed ? new Date().toISOString() : null
    setRows((rs) => rs.map((r) => ids.includes(r.id) ? { ...r, label_printed_at: stamp } : r))
  }

  async function download() {
    if (selected.size === 0) return
    setBusy(true)
    const ids = [...selected]
    const res = await fetch('/api/label', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })
    setBusy(false)
    if (!res.ok) { alert('Gagal membuat label.'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'label-buku.docx'; a.click()
    URL.revokeObjectURL(url)
    // DOCX terunduh -> tandai sudah dicetak (server sudah menandai, sinkronkan lokal)
    setRows((rs) => rs.map((r) => ids.includes(r.id) ? { ...r, label_printed_at: new Date().toISOString() } : r))
  }

  function printPdf() {
    if (selected.size === 0) return
    const ids = [...selected]
    const handler = () => { mark(ids, true); window.removeEventListener('afterprint', handler) }
    window.addEventListener('afterprint', handler)
    window.print()
  }

  const chosen = rows.filter((r) => selected.has(r.id))
  const selectedPrintedCount = chosen.filter((r) => r.label_printed_at).length

  return (
    <div className="space-y-4">
      <div className="no-print">
        <h1 className="text-xl font-bold text-slate-800">Cetak Label Buku</h1>
        <p className="text-sm text-slate-500">Saring & pilih buku, lalu unduh DOCX atau cetak PDF. Buku yang sudah pernah dicetak ditandai otomatis.</p>
      </div>

      {/* ---- Filter berganda ---- */}
      <div className="card no-print space-y-3">
        <input className="input" placeholder="🔍 Cari judul, pengarang, atau DDC..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-3">
          <div>
            <span className="label">Status cetak</span>
            <select className="select" value={fCetak} onChange={(e) => setFCetak(e.target.value as any)}>
              <option value="semua">Semua</option>
              <option value="belum">Belum dicetak</option>
              <option value="sudah">Sudah dicetak</option>
            </select>
          </div>
          <div>
            <span className="label">Kelengkapan info</span>
            <select className="select" value={fLengkap} onChange={(e) => setFLengkap(e.target.value as any)}>
              <option value="semua">Semua</option>
              <option value="lengkap">Sudah lengkap</option>
              <option value="belum">Belum lengkap</option>
            </select>
          </div>
          <div>
            <span className="label">Jenjang</span>
            <select className="select" value={fJenjang} onChange={(e) => setFJenjang(e.target.value)}>
              <option value="">Semua</option>
              {jenjangOpts.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-400">{shown.length} buku sesuai filter · {selected.size} dipilih{selectedPrintedCount > 0 ? ` (${selectedPrintedCount} sudah pernah dicetak)` : ''}</p>
      </div>

      {/* ---- Aksi pilih ---- */}
      <div className="flex flex-wrap gap-2 no-print">
        <button onClick={selectShown} className="btn-outline px-3 py-1.5 text-xs">Pilih semua ({shown.length})</button>
        <button onClick={selectShownComplete} className="btn-outline px-3 py-1.5 text-xs">Pilih semua yang lengkap ({shown.filter(isComplete).length})</button>
        <button onClick={clearAll} className="btn-outline px-3 py-1.5 text-xs">Kosongkan</button>
        <button onClick={() => mark([...selected], true)} disabled={selected.size === 0} className="btn-outline px-3 py-1.5 text-xs">✓ Tandai sudah dicetak</button>
        <button onClick={() => mark([...selected], false)} disabled={selected.size === 0} className="btn-outline px-3 py-1.5 text-xs">Batalkan tanda</button>
        <button onClick={download} disabled={busy || selected.size === 0} className="btn-outline px-3 py-1.5 text-xs">⬇️ Unduh DOCX ({selected.size})</button>
        <button onClick={printPdf} disabled={selected.size === 0} className="btn-primary px-3 py-1.5 text-xs">🖨️ Cetak / PDF</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card no-print">
          <h2 className="mb-2 font-semibold text-slate-800">Daftar Buku</h2>
          {loading ? <p className="text-sm text-slate-400">Memuat...</p> : shown.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada buku yang cocok dengan filter.</p>
          ) : (
            <div className="max-h-[60vh] space-y-1 overflow-auto">
              {shown.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  <span className="flex-1 truncate">{r.judul_buku}</span>
                  {r.label_printed_at && <span className="chip bg-emerald-100 text-emerald-700" style={{ maxWidth: 'none' }}>✓ dicetak</span>}
                  {!isComplete(r) && <span className="chip bg-amber-100 text-amber-700" style={{ maxWidth: 'none' }}>info kurang</span>}
                  <span className="text-xs text-slate-400">{r.nomor_klasifikasi || '-'}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 font-semibold text-slate-800 no-print">Pratinjau Label ({chosen.length})</h2>
          <div className="print-area">
            <div className="label-grid">
              {chosen.map((r) => (
                <div key={r.id} className="label-cell text-[10px]">
                  <span>Perpustakaan</span>
                  <span>Ibnu Abbas</span>
                  <span className="text-xs">{r.nomor_klasifikasi || '-'}</span>
                  <span className="text-xs">{r.nm_pngrng || '-'}</span>
                  <span className="text-xs">{r.prtm_jdl || '-'}</span>
                </div>
              ))}
            </div>
          </div>
          {chosen.length === 0 && <p className="text-sm text-slate-400 no-print">Belum ada buku dipilih.</p>}
        </div>
      </div>
    </div>
  )
}

export default function LabelPage() {
  return <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}><LabelInner /></Suspense>
}
