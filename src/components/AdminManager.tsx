'use client'
import { useState } from 'react'

interface Admin { id: string; username: string | null; full_name: string | null; role: string; is_active: boolean }

export default function AdminManager({ initialAdmins }: { initialAdmins: Admin[] }) {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function refresh() {
    const res = await fetch('/api/admin')
    if (res.ok) setAdmins((await res.json()).data || [])
  }

  async function create(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(''); setErr('')
    const res = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', username, full_name: fullName, password })
    })
    setBusy(false)
    if (!res.ok) { setErr((await res.json()).error || 'Gagal membuat admin.'); return }
    setMsg(`Admin "${username}" berhasil dibuat.`)
    setUsername(''); setFullName(''); setPassword('')
    refresh()
  }

  async function resetPw(id: string, uname: string) {
    const np = prompt(`Password baru untuk ${uname}:`)
    if (!np) return
    const res = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_password', id, password: np })
    })
    if (res.ok) alert('Password diperbarui.'); else alert('Gagal reset password.')
  }

  async function toggle(id: string, active: boolean) {
    const res = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_active', id, is_active: !active })
    })
    if (res.ok) refresh()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card space-y-3">
        <h2 className="font-semibold text-slate-800">Tambah Admin Baru</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><label className="label">Username</label><input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required autoCapitalize="none" /></div>
          <div><label className="label">Nama Lengkap</label><input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><label className="label">Password</label><input className="input" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        </div>
        {msg && <p className="text-sm text-brand-700">{msg}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Memproses...' : 'Buat Admin'}</button>
      </form>

      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-800">Daftar Admin</h2>
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-2 border-b border-slate-100 py-2 text-sm">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{a.username} {a.role === 'superadmin' && <span className="ml-1 rounded bg-amber-100 px-1.5 text-xs text-amber-700">Admin Utama</span>}</p>
                <p className="text-xs text-slate-400">{a.full_name || '-'} &middot; {a.is_active ? 'Aktif' : 'Nonaktif'}</p>
              </div>
              {a.role !== 'superadmin' && (
                <div className="flex gap-2">
                  <button onClick={() => resetPw(a.id, a.username || '')} className="btn-outline px-2 py-1 text-xs">Reset PW</button>
                  <button onClick={() => toggle(a.id, a.is_active)} className="btn-outline px-2 py-1 text-xs">{a.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
