'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const domain = process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN || 'griyabaca.local'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const supabase = createClient()
    const email = `${username.trim().toLowerCase()}@${domain}`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError('Username atau password salah.'); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-brand-800">Login Admin</h1>
          <p className="text-sm text-slate-500">Perpustakaan Griya Baca</p>
        </div>
        <form onSubmit={handleLogin} className="card space-y-4">
          <div>
            <label className="label">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="superadmin / admin01" autoCapitalize="none" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/login/user" className="text-brand-700 hover:underline">Masuk sebagai pengunjung &rarr;</Link>
        </div>
      </div>
    </main>
  )
}
