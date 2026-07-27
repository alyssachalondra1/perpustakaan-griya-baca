'use client'
import { useEffect, useRef, useState } from 'react'

// Tombol "Ambil cover otomatis": memanggil /api/cover-backfill berulang kali
// (per-batch) sampai semua buku tanpa cover selesai diproses.
export default function CoverBackfill() {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [found, setFound] = useState(0)
  const [processed, setProcessed] = useState(0)
  const [msg, setMsg] = useState('')
  const stopRef = useRef(false)

  async function refresh() {
    try {
      const res = await fetch('/api/cover-backfill')
      const j = await res.json()
      if (typeof j.remaining === 'number') setRemaining(j.remaining)
    } catch {}
  }
  useEffect(() => { refresh() }, [])

  async function run() {
    setRunning(true); stopRef.current = false; setMsg(''); setFound(0); setProcessed(0)
    let guard = 0
    while (!stopRef.current && guard < 200) {
      guard++
      let j: any
      try {
        const res = await fetch('/api/cover-backfill', { method: 'POST' })
        j = await res.json()
        if (!res.ok) { setMsg(j.error || 'Gagal.'); break }
      } catch (e: any) { setMsg('Koneksi terputus, coba lagi.'); break }
      setFound((f) => f + (j.found || 0))
      setProcessed((p) => p + (j.processed || 0))
      setRemaining(j.remaining ?? 0)
      if (!j.processed || j.remaining === 0) break
    }
    setRunning(false)
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base text-slate-800">Ambil Cover Otomatis</h2>
          <p className="text-sm text-slate-500">
            Mencari gambar sampul dari internet berdasarkan judul &amp; pengarang.
            {remaining !== null && <> Buku tanpa cover: <b className="text-slate-700">{remaining.toLocaleString('id-ID')}</b>.</>}
          </p>
        </div>
        {!running ? (
          <button onClick={run} disabled={remaining === 0} className="btn-primary">
            {remaining === 0 ? 'Semua sudah ada cover' : 'Mulai ambil cover'}
          </button>
        ) : (
          <button onClick={() => { stopRef.current = true }} className="btn-outline">Hentikan</button>
        )}
      </div>

      {(running || processed > 0) && (
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-slate-600">Diproses sesi ini: <b>{processed}</b> &middot; Ketemu cover: <b className="text-brand-700">{found}</b> &middot; Sisa: <b>{remaining ?? '-'}</b></p>
          {running && <p className="text-xs text-slate-400">Sedang berjalan… biarkan halaman ini terbuka.</p>}
        </div>
      )}
      {msg && <p className="mt-2 text-sm text-rose-600">{msg}</p>}
      <p className="mt-2 text-xs text-slate-400">Buku yang tidak ketemu cover-nya dibiarkan tanpa cover dan tidak akan dicoba ulang otomatis.</p>
    </div>
  )
}
