import { redirect } from 'next/navigation'
import { getSessionProfile } from '@/lib/auth'
import AppShell from '@/components/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionProfile()
  if (!session) redirect('/login/user')
  return <AppShell profile={session.profile}>{children}</AppShell>
}
