'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CoverScanner from '@/components/CoverScanner'
import BookForm, { BookInput } from '@/components/BookForm'

// Metode input: Scan Cover (AI) & Input Manual.
// Fitur "Scan ISBN" DIHILANGKAN sesuai permintaan.
type Tab = 'cover' | 'manual'

function TambahInner() {
  const params = useSearchParams()
  const editId = params.get('edit') || undefined
  const [tab, setTab] = useState<Tab>('cover')
  const [prefill, setPrefill] = useState<BookInput | undefined>(undefined)
  const [ready, setReady] = useState(!editId)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!editId) return
    fetch(`/api/books/${editId}`).then((r) => r.json()).then((j) => {
      setPrefill(j.data); setTab('manual'); setReady(true)
    })
  }, [editId])

  function onVision(meta: any) {
    setPrefill({ ...meta, input_method: 'cover' })
    setNotice('AI selesai membaca cover. Periksa & lengkapi data sebelum menyimpan.')
    setTab('manual')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'cover', label: '📷 Scan Cover' },
    { id: 'manual', label: '✍️ Input Manual' }
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{editId ? 'Edit Buku' : 'Tambah Buku'}</h1>
        <p className="text-sm text-slate-500">Scan cover dengan AI atau isi manual. Field wajib harus terisi sebelum disimpan.</p>
      </div>

      {!editId && (
        <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white text-sm">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 px-2 py-2 font-medium ${tab === t.id ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {notice && <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800">{notice}</div>}

      <div className="card">
        {tab === 'cover' && !editId && <CoverScanner onResult={onVision} />}
        {tab === 'manual' && ready && <BookForm initial={prefill} editId={editId} />}
        {tab === 'manual' && !ready && <p className="text-sm text-slate-400">Memuat data...</p>}
      </div>
    </div>
  )
}

export default function TambahPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Memuat...</p>}>
      <TambahInner />
    </Suspense>
  )
}
