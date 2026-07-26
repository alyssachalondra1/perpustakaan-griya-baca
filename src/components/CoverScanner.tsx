'use client'
import { useState } from 'react'

// Ambil foto cover depan & belakang (kamera HP) -> AI Vision (Gemini) baca judul dll,
// lalu OTOMATIS cari GAMBAR COVER digital dari internet berdasarkan judulnya.
// Foto HP TIDAK dipakai otomatis sebagai sampul (biar tampilan tetap rapi) -
// user memilih sendiri di langkah pratinjau.
export default function CoverScanner({ onResult }: { onResult: (meta: any) => void }) {
  const [front, setFront] = useState<string>('')
  const [back, setBack] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  // Hasil analisa + pilihan cover (langkah pratinjau)
  const [meta, setMeta] = useState<any | null>(null)
  const [foundCover, setFoundCover] = useState('')
  const [choice, setChoice] = useState<'found' | 'photo' | 'none'>('none')

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
    const m = json.data || {}

    // Cari gambar cover digital dari internet berdasarkan judul.
    let cover = m.cover_url || ''
    if (!cover && m.judul_buku) {
      setStatus('🎨 Mencari gambar cover dari internet...')
      try {
        const q = '/api/cover-search?title=' + encodeURIComponent(m.judul_buku) +
          '&author=' + encodeURIComponent(m.pengarang || '')
        const cr = await fetch(q)
        if (cr.ok) {
          const cj = await cr.json()
          if (cj.data?.cover_url) cover = cj.data.cover_url
        }
      } catch {}
    }

    setLoading(false); setStatus('')
    setMeta(m)
    setFoundCover(cover)
    setChoice(cover ? 'found' : 'none') // default: cover internet kalau ada, kalau tidak -> kartu warna
  }

  function confirmChoice() {
    if (!meta) return
    const cover = choice === 'found' ? foundCover : choice === 'photo' ? front : ''
    onResult({ ...meta, cover_url: cover })
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

  const Opt = ({ id, title, children }: { id: 'found' | 'photo' | 'none'; title: string; children: React.ReactNode }) => (
    <button type="button" onClick={() => setChoice(id)}
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition ${choice === id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300'}`}>
      {children}
      <span className="text-xs font-bold text-slate-600">{title}</span>
    </button>
  )

  // ---- Langkah 2: pratinjau & pilih cover ----
  if (meta) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-bold text-brand-700">✅ AI selesai membaca: <span className="text-slate-800">{meta.judul_buku || '(judul kosong)'}</span></p>
        <p className="text-sm text-slate-500">Pilih gambar sampul untuk ditampilkan di web:</p>

        <div className="grid grid-cols-3 gap-3">
          <Opt id="found" title={foundCover ? 'Cover dari internet' : 'Tidak tersedia'}>
            {foundCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foundCover} alt="cover internet" className="h-28 w-20 rounded-lg object-cover" />
            ) : (
              <div className="grid h-28 w-20 place-items-center rounded-lg bg-slate-100 text-2xl text-slate-300">—</div>
            )}
          </Opt>

          <Opt id="none" title="Kartu warna (rapi)">
            <div className="grid h-28 w-20 place-items-center rounded-lg bg-gradient-to-br from-rose-400 to-violet-400 px-1 text-center">
              <span className="font-display text-[10px] font-bold leading-tight text-white line-clamp-4">{meta.judul_buku || 'Judul Buku'}</span>
            </div>
          </Opt>

          <Opt id="photo" title="Foto hasil scan">
            {front ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={front} alt="foto scan" className="h-28 w-20 rounded-lg object-cover" />
            ) : (
              <div className="grid h-28 w-20 place-items-center rounded-lg bg-slate-100 text-2xl">📷</div>
            )}
          </Opt>
        </div>

        <p className="text-xs text-slate-400">
          Rekomendasi: pakai “Cover dari internet” jika ada. Kalau tidak tersedia, “Kartu warna” biasanya lebih rapi daripada foto HP.
        </p>

        <div className="flex gap-2">
          <button onClick={() => { setMeta(null); setFoundCover('') }} className="btn-outline">&larr; Ulangi</button>
          <button onClick={confirmChoice} className="btn-primary flex-1">Lanjut isi data →</button>
        </div>
      </div>
    )
  }

  // ---- Langkah 1: ambil foto ----
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
        Foto HP tidak otomatis jadi sampul — kamu pilih sendiri di langkah berikutnya.
      </p>
    </div>
  )
}
