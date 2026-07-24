import { redirect } from 'next/navigation'
import { getSessionProfile, isSuperadmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import AdminManager from '@/components/AdminManager'

export const dynamic = 'force-dynamic'

export default async function AdminManagementPage() {
  const session = await getSessionProfile()
  if (!isSuperadmin(session?.profile.role)) redirect('/dashboard')

  const supabase = createClient()
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, is_active')
    .in('role', ['admin', 'superadmin'])
    .order('role', { ascending: true })

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Kelola Admin</h1>
        <p className="text-sm text-slate-500">Buat akun admin, reset password, dan aktif/nonaktifkan akun.</p>
      </div>
      <AdminManager initialAdmins={(admins as any) || []} />
    </div>
  )
}
