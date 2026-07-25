import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Callback OAuth Google: tukar code -> session.
// Staff diarahkan ke /dashboard, pengunjung ke halaman perpustakaan (/).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      let dest = '/'
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (p && (p.role === 'admin' || p.role === 'superadmin')) dest = '/dashboard'
      }
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }
  return NextResponse.redirect(`${origin}/login/user?error=auth`)
}
