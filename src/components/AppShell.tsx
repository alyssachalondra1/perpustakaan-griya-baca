'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▤', roles: ['superadmin', 'admin', 'user'] },
  { href: '/katalog', label: 'Katalog Buku', icon: '📚', roles: ['superadmin', 'admin', 'user'] },
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
  const initial = (profile.full_name || profile.username || 'P').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-1 text-slate-600 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
          </button>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-base text-white">📚</span>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-slate-800">Griya Baca</p>
              <p className="text-[11px] text-slate-400">Sistem Inventaris</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-700">{profile.full_name || profile.username || 'Pengguna'}</p>
            <p className="text-[11px] text-slate-400">{roleLabel}</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{initial}</span>
          <button onClick={logout} className="btn-outline px-3 py-1.5 text-xs">Keluar</button>
        </div>
      </header>

      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-100 bg-white pt-16 transition-transform md:static md:translate-x-0 md:pt-4 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="space-y-1 p-3">
            {items.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/')
              return (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <span className="text-base">{n.icon}</span>{n.label}
                </Link>
              )
            })}
          </nav>
        </aside>
        {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

        <main className="min-h-[calc(100vh-61px)] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
