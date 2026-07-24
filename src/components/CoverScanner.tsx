'use client'
import { useState } from 'react'

// Ambil foto cover depan & belakang (kamera HP) lalu kirim ke AI Vision (Gemini).
export default function CoverScanner({ onResult }: { onResult: (meta: any) => void }) {
  const [front, setFront] = useState<string>('')
  const [back, setBack] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 1024
        let { width, height } = img
        if (width > height && width > max) { height = Math.round(height * max / width); width = max }
        else if (height > max) { width = Math.round(width * max / height); height = max }
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
    setLoading(true); setError('')
    const images = [front, back].filter(Boolean)
    const res = await fetch('/api/vision', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images })
    })
    setLoading(false)
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || 'AI gagal membaca cover.'); return }
    const json = await res.json()
    onResult(json.data || {})
  }

  const Slot = ({ label, val, which }: { label: string; val: string; which: 'front' | 'back' }) => (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-3 text-center hover:border-brand-400">
      {val ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={val} alt={label} className="h-32 w-24 rounded object-cover" />
      ) : (
        <div className="flex h-32 w-24 items-center justify-center rounded bg-slate-100 text-3xl">📷</div>
      )}
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e, which)} />
    </label>
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Slot label="Cover Depan" val={front} which="front" />
        <Slot label="Cover Belakang" val={back} which="back" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={analyze} disabled={loading || !front} className="btn-primary w-full">
        {loading ? '🤖 AI sedang membaca...' : '🤖 Baca dengan AI Vision'}
      </button>
      <p className="text-xs text-slate-400">Gunakan saat buku tidak punya ISBN. Data hasil AI tetap bisa Anda koreksi manual.</p>
    </div>
  )
}
