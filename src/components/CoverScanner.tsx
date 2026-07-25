'use client'
import { useState } from 'react'

// Ambil foto cover depan & belakang (kamera HP) -> AI Vision (Gemini) baca judul dll,
// lalu OTOMATIS cari GAMBAR COVER digital dari internet berdasarkan judulnya.
export default function CoverScanner({ onResult }: { onResult: (meta: any) => void }) {
  const [front, setFront] = useState<string>('')
  const [back, setBack] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  // Perkecil foto sebelum dikirim (biar AI cepat & hemat kuota).
  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => {
        const img = new Image()
        img.onload = () => {
          const max = 1024
          let { width, height } = img
          if (width > max || height > max) {
            const s = Math.min(max / width, max / height)
            width = Math.round(width * s); height = Math.round(height * s)
          }
          const canvas = document.createElement('canvas')
          canvas.width = width; canvas.height = height
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.onerror = reject
        img.src = r.result as string
      }
      r.onerror = reject
      r.readAsDataURL(file)
    })
  }

  async function pick(e: React.ChangeEvent<HTMLInputElement>, which: 'front' | 'back') {
    const f = e.target.files?.[0]
    if (!f) return
    const b64 = await toBase64(f)
    which === 'front' ? setFront(b64) : setBack(b64)
  }

  async function analyze() {
    if (!front) { setError('Minimal foto cover depan diperlukan.'); return }
    setLoading(true); setError(''); setStatus('🤖 AI sedang membaca cover...')
    const images = [front, back].filter(Boolean)
    const res = await fetch('/api/vision', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images })
    })
    if (!res.ok) {
      setLoading(false); setStatus('')
      const j = await res.json().catch(() => ({})); setError(j.error || 'AI gagal membaca cover.'); return
    }
    const json = await res.json()
    const meta = json.data || {}

    // Kalau AI belum dapat gambar cover, cari gambar digital dari internet by judul.
    if (!meta.cover_url && meta.judul_buku) {
      setStatus('🎨 Mencari gambar cover dari internet...')
      try {
        const q = '/api/cover-search?title=' + encodeURIComponent(meta.judul_buku) +
          '&author=' + encodeURIComponent(meta.pengarang || '')
        const cr = await fetch(q)
        if (cr.ok) {
          const cj = await cr.json()
          if (cj.data?.cover_url) meta.cover_url = cj.data.cover_url
        }
      } catch {}
    }

    // Cadangan terakhir: kalau tetap tidak ketemu, pakai FOTO hasil scan sebagai cover.
    if (!meta.cover_url && front) meta.cover_url = front

    setLoading(false); setStatus('')
    onResult(meta)
  }

  const Slot = ({ label, val, which }: { label: string; val: string; which: 'front' | 'back' }) => (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-3 text-center hover:border-brand-400">
      {val ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={val} alt={label} className="h-32 w-24 rounded-xl object-cover" />
      ) : (
        <div className="flex h-32 w-24 items-center justify-center rounded-xl bg-slate-100 text-3xl">📷</div>
      )}
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e, which)} />
    </label>
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Slot label="Cover Depan" val={front} which="front" />
        <Slot label="Cover Belakang" val={back} which="back" />
      </div>
      {status && <p className="text-sm font-bold text-brand-700">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={analyze} disabled={loading || !front} className="btn-primary w-full">
        {loading ? 'Memproses...' : '🤖 Baca Cover & Cari Gambar'}
      </button>
      <p className="text-xs text-slate-400">
        AI membaca judul dari foto, lalu mencari gambar cover digital dari internet.
        Jika tidak ketemu, foto hasil scan otomatis dipakai sebagai cover. Semua data tetap bisa dikoreksi manual.
      </p>
    </div>
  )
}
