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
    router.push('/login/user')
    router.refresh()
  }

  const roleLabel = profile.role === 'superadmin' ? 'Admin Utama' : profile.role === 'admin' ? 'Admin' : 'Pengunjung'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button className="rounded p-1 text-slate-600 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
          </button>
          <div className="leading-tight">
            <p className="text-sm font-bold text-brand-800">Perpustakaan Griya Baca</p>
            <p className="text-[11px] text-slate-400">Sistem Inventaris</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{profile.full_name || profile.username || 'Pengguna'}</p>
            <p className="text-[11px] text-slate-400">{roleLabel}</p>
          </div>
          <button onClick={logout} className="btn-outline px-3 py-1.5 text-xs">Keluar</button>
        </div>
      </header>

      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white pt-16 transition-transform md:static md:translate-x-0 md:pt-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="space-y-1 p-3">
            {items.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/')
              return (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${active ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <span className="text-base">{n.icon}</span>{n.label}
                </Link>
              )
            })}
          </nav>
        </aside>
        {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

        <main className="min-h-[calc(100vh-57px)] flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
