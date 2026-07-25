'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UserLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogle() {
    setLoading(true); setError('')
    const supabase = createClient()
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${site}/auth/callback` }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-400 to-brand-600 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-white/20 text-3xl">📚</div>
          <h1 className="font-display text-2xl font-bold">Login Pengunjung</h1>
          <p className="mt-1 text-sm text-brand-50">Simpan buku favoritmu di Perpustakaan Griya Baca</p>
        </div>
        <div className="card space-y-4">
          <button onClick={handleGoogle} disabled={loading} className="btn-outline w-full">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.3 5.3C39.9 36.2 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
            {loading ? 'Mengarahkan ke Google...' : 'Masuk dengan Google'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Link href="/" className="block text-center text-xs font-bold text-brand-700 hover:underline">
            Lihat perpustakaan tanpa login &rarr;
          </Link>
        </div>
        <div className="mt-4 text-center text-sm">
          <Link href="/login/admin" className="font-bold text-white/90 hover:underline">&larr; Masuk sebagai admin</Link>
        </div>
      </div>
    </main>
  )
}
