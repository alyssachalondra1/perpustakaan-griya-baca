'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { nmPngrng, prtmJdl, suggestDdc } from '@/lib/classification'
import type { Book } from '@/types'

export type BookInput = Partial<Book>

// DDC (nomor_klasifikasi) & perjenjangan TIDAK wajib.
const REQUIRED: { key: keyof Book; label: string }[] = [
  { key: 'judul_buku', label: 'Judul Buku' },
  { key: 'pengarang', label: 'Pengarang' },
  { key: 'penerbit', label: 'Penerbit' },
  { key: 'tahun_terbit', label: 'Tahun Terbit' },
  { key: 'jumlah_eksemplar', label: 'Jumlah Eksemplar' }
]

export default function BookForm({ initial, editId }: { initial?: BookInput; editId?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<BookInput>({
    judul_buku: '', pengarang: '', penerbit: '', tahun_terbit: '', jumlah_eksemplar: 1,
    subjek: '', sumber: '', keterangan: '', nomor_klasifikasi: '', perjenjangan: '',
    isbn: '', deskripsi: '', cover_url: '', ...initial
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function set<K extends keyof Book>(k: K, v: any) { setForm((f) => ({ ...f, [k]: v })) }

  const nm = useMemo(() => nmPngrng(form.pengarang || ''), [form.pengarang])
  const jdl = useMemo(() => prtmJdl(form.judul_buku || ''), [form.judul_buku])
  const ddcHint = useMemo(() => suggestDdc(form.subjek || undefined, form.judul_buku || undefined), [form.subjek, form.judul_buku])

  const missing = REQUIRED.filter((r) => {
    const v = (form as any)[r.key]
    return v === undefined || v === null || String(v).trim() === '' || (r.key === 'jumlah_eksemplar' && Number(v) < 1)
  })
  const canSubmit = missing.length === 0 && !saving

  async function submit() {
    setSaving(true); setMsg('')
    const payload = { ...form, nm_pngrng: nm, prtm_jdl: jdl }
    const url = editId ? `/api/books/${editId}` : '/api/books'
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) {
      const json = await res.json()
      router.push(`/buku/${editId || json.data.id}`)
      router.refresh()
    } else {
      const j = await res.json().catch(() => ({}))
      setMsg(j.error || 'Gagal menyimpan buku.')
    }
  }

  // PENTING: input ditulis LANGSUNG (bukan lewat komponen <Field/> di dalam
  // render). Sebelumnya <Field/> dibuat ulang tiap render sehihngga input
  // di-remount & keyboard HP ketutup tiap ketik 1 huruf. Ini yang diperbaiki.
  function field(k: keyof Book, label: string, opts?: { type?: string; req?: boolean; span2?: boolean }) {
    const type = opts?.type || 'text'
    return (
      <div key={String(k)} className={opts?.span2 ? 'sm:col-span-2' : ''}>
        <label className="label">{label} {opts?.req && <span className="text-red-500">*</span>}</label>
        <input
          className="input"
          type={type}
          inputMode={type === 'number' ? 'numeric' : undefined}
          value={(form as any)[k] ?? ''}
          onChange={(e) => set(k, type === 'number' ? Number(e.target.value) : e.target.value)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {form.cover_url ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.cover_url} alt="cover" className="h-24 w-16 rounded object-cover" />
          <span className="text-xs text-slate-400">Cover buku</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {field('judul_buku', 'Judul Buku', { req: true, span2: true })}
        {field('pengarang', 'Pengarang', { req: true })}
        {field('penerbit', 'Penerbit', { req: true })}
        {field('tahun_terbit', 'Tahun Terbit', { req: true })}
        {field('jumlah_eksemplar', 'Jumlah Eksemplar', { req: true, type: 'number' })}
        {field('subjek', 'Subjek')}
        {field('sumber', 'Sumber')}
        <div>
          <label className="label">Nomor Klasifikasi (DDC) <span className="text-xs font-normal text-slate-400">(opsional)</span></label>
          <input className="input" value={form.nomor_klasifikasi ?? ''} onChange={(e) => set('nomor_klasifikasi', e.target.value)} placeholder="mis. 398.2 — boleh dikosongkan, isi nanti" />
          {ddcHint && <p className="mt-1 text-xs text-brand-700">Saran: {ddcHint.ddc} ({ddcHint.label}) &mdash; boleh diubah/dikosongkan.</p>}
        </div>
        {field('perjenjangan', 'Perjenjangan / Level (opsional)')}
        {field('isbn', 'ISBN (opsional, tidak diekspor)')}
        <div className="sm:col-span-2">
          <label className="label">Keterangan</label>
          <textarea className="input" rows={2} value={form.keterangan ?? ''} onChange={(e) => set('keterangan', e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg bg-slate-100 p-3 text-sm">
        <p className="font-medium text-slate-600">Kode otomatis:</p>
        <p className="text-slate-800">NM-PNGRNG: <b>{nm || '-'}</b> &nbsp;|&nbsp; PRTM JDL: <b>{jdl || '-'}</b></p>
        <p className="mt-1 text-slate-800">Nomor panggil label: <b>{[form.nomor_klasifikasi, nm, jdl].filter(Boolean).join('  ') || '-'}</b></p>
      </div>

      {missing.length > 0 && (
        <p className="text-sm text-amber-600">Lengkapi dulu: {missing.map((m) => m.label).join(', ')}</p>
      )}
      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <button onClick={submit} disabled={!canSubmit} className="btn-primary w-full sm:w-auto">
        {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan Buku'}
      </button>
    </div>
  )
}
