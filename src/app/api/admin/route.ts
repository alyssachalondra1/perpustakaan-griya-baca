import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionProfile, isSuperadmin } from '@/lib/auth'
import { writeLog } from '@/lib/log'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSessionProfile()
  if (!isSuperadmin(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const supabase = createClient()
  const { data } = await supabase.from('profiles').select('id, username, full_name, role, is_active').in('role', ['admin', 'superadmin']).order('role')
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const session = await getSessionProfile()
  if (!isSuperadmin(session?.profile.role)) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
  const admin = createAdminClient()
  const supabase = createClient()
  const body = await request.json()
  const domain = process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN || 'griyabaca.local'

  if (body.action === 'create') {
    const username = String(body.username || '').trim().toLowerCase()
    if (!username || !body.password) return NextResponse.json({ error: 'Username & password wajib' }, { status: 400 })
    const email = `${username}@${domain}`
    const { data: created, error } = await admin.auth.admin.createUser({
      email, password: body.password, email_confirm: true,
      user_metadata: { username, full_name: body.full_name || username, role: 'admin' }
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await admin.from('profiles').update({ username, full_name: body.full_name || username, role: 'admin' }).eq('id', created.user.id)
    await writeLog(supabase, { userId: session!.userId, username: session!.profile.username, action: 'create', judul: `Buat admin ${username}` })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'reset_password') {
    if (!body.id || !body.password) return NextResponse.json({ error: 'Data kurang' }, { status: 400 })
    const { error } = await admin.auth.admin.updateUserById(body.id, { password: body.password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await writeLog(supabase, { userId: session!.userId, username: session!.profile.username, action: 'reset_password', recordId: body.id })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'toggle_active') {
    const { error } = await admin.from('profiles').update({ is_active: body.is_active }).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 })
}
