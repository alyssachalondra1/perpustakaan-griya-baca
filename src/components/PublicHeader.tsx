'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PublicHeader({ user }: { user: { name: string; isStaff: boolean } | null }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b-2 border-amber-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-xl shadow-[0_3px_0_0] shadow-brand-700">📚</span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-brand-700">Griya Baca</span>
            <span className="block text-[11px] text-slate-400">Perpustakaan Digital</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/tersimpan" className="btn-outline px-3 py-1.5 text-xs">★ Tersimpan</Link>
              {user.isStaff && <Link href="/dashboard" className="btn-outline px-3 py-1.5 text-xs">Dashboard</Link>}
              <span className="hidden text-sm font-bold text-slate-600 sm:block">Hai, {user.name.split(' ')[0]}!</span>
              <button onClick={logout} className="btn-primary px-3 py-1.5 text-xs">Keluar</button>
            </>
          ) : (
            <div className="relative">
              <button onClick={() => setOpen(!open)} className="btn-primary px-4 py-1.5 text-xs">Masuk ▾</button>
              {open && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border-2 border-slate-100 bg-white shadow-xl">
                    <Link href="/login/user" className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-amber-50">👤 Login Pengunjung</Link>
                    <div className="h-px bg-slate-100" />
                    <Link href="/login/admin" className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-amber-50">🔑 Login Admin</Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
