import { redirect } from 'next/navigation'
import { getSessionProfile, isStaff } from '@/lib/auth'
import AppShell from '@/components/AppShell'

// Area pengelolaan hanya untuk staff (admin/superadmin).
// Pengunjung biasa diarahkan ke halaman perpustakaan publik.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile()
  if (!session) redirect('/login/admin')
  if (!isStaff(session.profile.role)) redirect('/')
  return <AppShell profile={session.profile}>{children}</AppShell>
}
