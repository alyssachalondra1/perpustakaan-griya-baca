import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSessionProfile, isStaff } from '@/lib/auth'
import ExportButtons from '@/components/ExportButtons'

export const dynamic = 'force-dynamic'

async function count(table: string, filter?: (q: any) => any) {
  const supabase = createClient()
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = filter(q)
  const { count } = await q
  return count || 0
}

const TILE = ['from-orange-400 to-rose-500', 'from-sky-400 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-violet-400 to-fuchsia-500', 'from-amber-400 to-orange-500', 'from-cyan-400 to-blue-500']

export default async function DashboardPage() {
  const session = await getSessionProfile()
  const supabase = createClient()

  const totalBuku = await count('books')
  const totalAdmin = await count('profiles', (q) => q.in('role', ['admin', 'superadmin']))
  const totalUser = await count('profiles', (q) => q.eq('role', 'user'))
  // Buku yang DDC-nya masih kosong (perlu dilengkapi admin)
  const tanpaDdc = await count('books', (q) => q.or('nomor_klasifikasi.is.null,nomor_klasifikasi.eq.'))
  // Buku yang informasinya belum lengkap (DDC / penerbit / tahun / pengarang kosong)
  const { data: cek } = await supabase.from('books').select('nomor_klasifikasi, penerbit, tahun_terbit, pengarang')
  const kurang = (b: any) => !String(b.nomor_klasifikasi || '').trim() || !String(b.penerbit || '').trim() || !String(b.tahun_terbit || '').trim() || !String(b.pengarang || '').trim()
  const infoKurang = (cek || []).filter(kurang).length

  const { data: terbaru } = await supabase
    .from('books')
    .select('id, judul_buku, pengarang, nomor_inventaris, created_at')
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: rekap } = await supabase
    .from('rekap_inventaris')
    .select('*')
    .order('tanggal', { ascending: false })
    .limit(7)

  const stat = [
    { label: 'Total Buku', value: totalBuku, icon: '📚', grad: 'from-orange-400 to-rose-500' },
    { label: 'Total Admin', value: totalAdmin, icon: '🛡️', grad: 'from-sky-400 to-indigo-500' },
    { label: 'Total Pengunjung', value: totalUser, icon: '👥', grad: 'from-emerald-400 to-teal-500' },
    { label: 'Info Belum Lengkap', value: infoKurang, icon: '📝', grad: 'from-amber-400 to-orange-500', href: '/katalog?info=kurang' }
  ]

  const staff = isStaff(session?.profile.role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-slate-800">Selamat datang, {session?.profile.full_name || session?.profile.username} 👋</h1>
        <p className="text-sm text-slate-500">Ringkasan inventaris Perpustakaan Griya Baca.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat.map((s) => {
          const inner = (
            <>
              <div className="stat-deco -right-6 -top-10 h-32 w-32" />
              <div className="stat-deco -bottom-10 right-10 h-20 w-20 bg-white/10" />
              <div className="relative z-10">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/25 text-xl backdrop-blur-sm">{s.icon}</div>
                <p className="text-3xl font-extrabold leading-none">{s.value.toLocaleString('id-ID')}</p>
                <p className="mt-1.5 text-sm font-medium text-white/90">{s.label}</p>
              </div>
            </>
          )
          const cls = `stat bg-gradient-to-br ${s.grad}`
          return (s as any).href
            ? <Link key={s.label} href={(s as any).href} className={`${cls} block transition hover:brightness-105`}>{inner}</Link>
            : <div key={s.label} className={cls}>{inner}</div>
        })}
      </div>

      {/* Penanda: buku yang DDC-nya masih kosong */}
      {staff && tanpaDdc > 0 && (
        <Link href="/katalog?ddc=kosong" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400 text-lg text-white">⚠️</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-800">{tanpaDdc.toLocaleString('id-ID')} buku belum ada Nomor Klasifikasi (DDC)</p>
            <p className="text-xs text-amber-700">Klik untuk melihat &amp; melengkapi (scan halaman KDT atau isi manual).</p>
          </div>
          <span className="text-sm font-semibold text-amber-700">Lihat →</span>
        </Link>
      )}

      {staff && (
        <div className="card">
          <h2 className="mb-3 text-base text-slate-800">Export Data Excel</h2>
          <ExportButtons />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base text-slate-800">Buku Terbaru</h2>
            <Link href="/katalog" className="text-sm font-semibold text-brand-700 hover:underline">Lihat semua</Link>
          </div>
          {terbaru && terbaru.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {terbaru.map((b, i) => (
                <li key={b.id} className="flex items-center gap-3 py-2.5">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${TILE[i % TILE.length]} text-sm font-extrabold text-white`}>
                    {(b.judul_buku || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/buku/${b.id}`} className="block truncate text-sm font-semibold text-slate-800 hover:text-brand-700">{b.judul_buku}</Link>
                    <p className="truncate text-xs text-slate-400">{b.pengarang} &middot; No. {b.nomor_inventaris}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">Belum ada buku. Mulai tambahkan dari menu Tambah Buku.</p>}
        </div>

        <div className="card">
          <h2 className="mb-3 text-base text-slate-800">Statistik Inventaris</h2>
          {rekap && rekap.length > 0 ? (
            <ul className="space-y-2.5">
              {rekap.map((r: any) => (
                <li key={r.tanggal} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="font-semibold text-slate-800">{r.jumlah} buku</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">Belum ada data.</p>}
        </div>
      </div>
    </div>
  )
}
