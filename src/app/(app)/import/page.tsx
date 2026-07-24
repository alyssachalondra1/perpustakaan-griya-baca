'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ImportPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function doPreview() {
    if (!file) return
    setBusy(true); setMsg('')
    const fd = new FormData(); fd.append('file', file); fd.append('mode', 'preview')
    const res = await fetch('/api/import', { method: 'POST', body: fd })
    setBusy(false)
    if (!res.ok) { setMsg((await res.json()).error || 'Gagal membaca file.'); return }
    setPreview(await res.json())
  }

  async function doCommit() {
    if (!file) return
    setBusy(true); setMsg('')
    const fd = new FormData(); fd.append('file', file); fd.append('mode', 'commit')
    const res = await fetch('/api/import', { method: 'POST', body: fd })
    setBusy(false)
    if (!res.ok) { setMsg((await res.json()).error || 'Gagal mengimpor.'); return }
    const json = await res.json()
    setMsg(`Berhasil mengimpor ${json.inserted} buku.`)
    setPreview(null); setFile(null)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Import dari Excel</h1>
        <p className="text-sm text-slate-500">Unggah file Excel format TBM (10 kolom) atau FIX (13 kolom). Sistem mendeteksi otomatis.</p>
      </div>

      <div className="card space-y-3">
        <input type="file" accept=".xlsx,.xls" onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null) }} className="text-sm" />
        <div className="flex gap-2">
          <button onClick={doPreview} disabled={!file || busy} className="btn-outline">{busy ? 'Memproses...' : 'Pratinjau'}</button>
          {preview && preview.valid?.length > 0 && (
            <button onClick={doCommit} disabled={busy} className="btn-primary">Impor {preview.valid.length} Buku</button>
          )}
        </div>
        {msg && <p className="text-sm text-brand-700">{msg}</p>}
      </div>

      {preview && (
        <div className="card space-y-3">
          <p className="text-sm">Format terdeteksi: <b>{preview.detectedFormat?.toUpperCase()}</b> &middot; Valid: <b className="text-brand-700">{preview.valid?.length || 0}</b> &middot; Gagal: <b className="text-red-600">{preview.failed?.length || 0}</b></p>
          {preview.failed?.length > 0 && (
            <div className="rounded-lg bg-red-50 p-3 text-sm">
              <p className="mb-1 font-medium text-red-700">Baris bermasalah:</p>
              <ul className="list-inside list-disc text-red-600">
                {preview.failed.slice(0, 20).map((f: any, i: number) => (<li key={i}>Baris {f.rowNumber}: {f.error}</li>))}
              </ul>
            </div>
          )}
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100"><tr><th className="p-2">Judul</th><th className="p-2">Pengarang</th><th className="p-2">Tahun</th></tr></thead>
              <tbody>
                {preview.valid?.slice(0, 50).map((v: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100"><td className="p-2">{v.data.judul_buku}</td><td className="p-2">{v.data.pengarang}</td><td className="p-2">{v.data.tahun_terbit}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
