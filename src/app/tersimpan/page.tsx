import { redirect } from 'next/navigation'
import { getSessionProfile, isStaff } from '@/lib/auth'
import PublicHeader from '@/components/PublicHeader'
import SavedList from '@/components/SavedList'

export const dynamic = 'force-dynamic'

export default async function TersimpanPage() {
  const session = await getSessionProfile()
  if (!session) redirect('/login/user')
  const user = { name: session.profile.full_name || session.profile.username || 'Pengguna', isStaff: isStaff(session.profile.role) }

  return (
    <>
      <PublicHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-1 font-display text-2xl font-bold text-slate-800">★ Buku Tersimpan</h1>
        <p className="mb-4 text-sm text-slate-500">Koleksi buku favorit yang kamu simpan.</p>
        <SavedList />
      </main>
    </>
  )
}
