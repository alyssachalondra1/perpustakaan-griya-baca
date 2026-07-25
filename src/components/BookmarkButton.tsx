'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookmarkButton({ bookId, initial, isLoggedIn }: { bookId: string; initial: boolean; isLoggedIn: boolean }) {
  const router = useRouter()
  const [saved, setSaved] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!isLoggedIn) { router.push('/login/user'); return }
    setLoading(true)
    try {
      if (saved) {
        await fetch('/api/bookmarks?book_id=' + bookId, { method: 'DELETE' })
        setSaved(false)
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ book_id: bookId })
        })
        setSaved(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={saved
        ? 'btn bg-amber-400 text-amber-950 shadow-[0_4px_0_0] shadow-amber-600 hover:bg-amber-300'
        : 'btn-outline'}
    >
      {saved ? '★ Tersimpan' : '☆ Simpan buku'}
    </button>
  )
}
