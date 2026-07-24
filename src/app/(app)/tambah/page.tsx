'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BarcodeScanner from '@/components/BarcodeScanner'
import CoverScanner from '@/components/CoverScanner'
import BookForm, { BookInput } from '@/components/BookForm'

type Tab = 'isbn' | 'cover' | 'manual'

function TambahInner() {
  const params = useSearchParams()
  const editId = params.get('edit') || undefined
  const [tab, setTab] = useState<Tab>('isbn')
  const [prefill, setPrefill] = useState<BookInput | undefined>(undefined)
  const [ready, setReady] = useState(!editId)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!editId) return
    fetch(`/api/books/${editId}`).then((r) => r.json()).then((j) => {
      setPrefill(j.data); setTab('manual'); setReady(true)
    })
  }, [editId])

  async function onIsbn(isbn: string) {
    setNotice('Mengambil data dari Google Books...')
    const res = await fetch('/api/google-books?isbn=' + encodeURIComponent(isbn))
    const json = await res.json()
    if (json.data) {
      setPrefill({ ...json.data, isbn, input_method: 'isbn' })
      setNotice('Data ISBN ditemukan. Lengkapi field yang masih kosong lalu simpan.')
    } else {
      setPrefill({ isbn, input_method: 'isbn' })
      setNotice('ISBN tidak ditemukan di Google Books. Silakan isi manual atau coba Scan Cover.')
    }
    setTab('manual')
  }

  function onVision(meta: any) {
    setPrefill({ ...meta, input_method: 'cover' })
    setNotice('AI selesai membaca cover. Periksa & lengkapi data sebelum menyimpan.')
    setTab('manual')
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'isbn', label: '1. Scan ISBN' },
    { id: 'cover', label: '2. Scan Cover' },
    { id: 'manual', label: '3. Input Manual' }
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{editId ? 'Edit Buku' : 'Tambah Buku'}</h1>
        <p className="text-sm text-slate-500">Pilih metode input. Semua field wajib harus terisi sebelum disimpan.</p>
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
        {tab === 'isbn' && !editId && <BarcodeScanner onDetected={onIsbn} />}
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
