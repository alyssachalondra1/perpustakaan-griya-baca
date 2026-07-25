'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SavedList() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/bookmarks')
    const json = await res.json()
    setRows(json.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function remove(bookId: string) {
    await fetch('/api/bookmarks?book_id=' + bookId, { method: 'DELETE' })
    setRows((prev) => prev.filter((x) => x.book_id !== bookId))
  }

  if (loading) return <p className="text-sm text-slate-400">Memuat...</p>
  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-400">
        Belum ada buku tersimpan. Jelajahi <Link href="/" className="font-bold text-brand-600">perpustakaan</Link> dan simpan favoritmu ★
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => {
        const b = r.books
        if (!b) return null
        return (
          <div key={r.book_id} className="card flex gap-3">
            {b.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.cover_url} alt="" className="h-24 w-16 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="grid h-24 w-16 shrink-0 place-items-center rounded-xl bg-amber-100 text-2xl">📘</div>
            )}
            <div className="min-w-0 flex-1">
              <Link href={`/buku/${b.id}`} className="line-clamp-2 text-sm font-bold text-slate-800 hover:text-brand-600">{b.judul_buku}</Link>
              <p className="truncate text-xs text-slate-500">{b.pengarang}</p>
              <button onClick={() => remove(r.book_id)} className="mt-2 text-xs font-bold text-rose-500 hover:underline">Hapus dari tersimpan</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
