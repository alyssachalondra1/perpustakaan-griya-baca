'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▤', roles: ['superadmin', 'admin'] },
  { href: '/katalog', label: 'Katalog Buku', icon: '📚', roles: ['superadmin', 'admin'] },
  { href: '/tambah', label: 'Tambah Buku', icon: '➕', roles: ['superadmin', 'admin'] },
  { href: '/label', label: 'Cetak Label', icon: '🏷️', roles: ['superadmin', 'admin'] },
  { href: '/import', label: 'Import Excel', icon: '📥', roles: ['superadmin'] },
  { href: '/admin-management', label: 'Kelola Admin', icon: '👥', roles: ['superadmin'] },
  { href: '/log', label: 'Riwayat Perubahan', icon: '🕒', roles: ['superadmin'] }
]

export default function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const items = NAV.filter((n) => n.roles.includes(profile.role))

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const roleLabel = profile.role === 'superadmin' ? 'Admin Utama' : profile.role === 'admin' ? 'Admin' : 'Pengunjung'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-amber-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-1 text-slate-600 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-500 text-lg shadow-[0_3px_0_0] shadow-brand-700">📚</span>
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-brand-800">Griya Baca</p>
              <p className="text-[11px] text-slate-400">Panel Admin</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="btn-outline hidden px-3 py-1.5 text-xs sm:inline-flex">🏠 Perpustakaan</Link>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold">{profile.full_name || profile.username || 'Pengguna'}</p>
            <p className="text-[11px] text-slate-400">{roleLabel}</p>
          </div>
          <button onClick={logout} className="btn-primary px-3 py-1.5 text-xs">Keluar</button>
        </div>
      </header>

      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r-2 border-amber-100 bg-white pt-16 transition-transform md:static md:translate-x-0 md:pt-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="space-y-1 p-3">
            {items.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/')
              return (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold ${active ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-amber-50'}`}>
                  <span className="text-base">{n.icon}</span>{n.label}
                </Link>
              )
            })}
            <Link href="/" onClick={() => setOpen(false)} className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-amber-50 sm:hidden">
              <span className="text-base">🏠</span>Ke Perpustakaan
            </Link>
          </nav>
        </aside>
        {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

        <main className="min-h-[calc(100vh-61px)] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
