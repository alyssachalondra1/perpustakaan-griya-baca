import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Halaman staff (admin) + halaman "tersimpan" (butuh login apa pun).
  // CATATAN: '/log' ditulis eksak agar TIDAK menangkap '/login'.
  const isProtected =
    path.startsWith('/dashboard') || path.startsWith('/katalog') ||
    path.startsWith('/tambah') || path.startsWith('/label') ||
    path.startsWith('/import') || path.startsWith('/admin-management') ||
    path === '/log' || path.startsWith('/log/') ||
    path === '/tersimpan' || path.startsWith('/tersimpan/')

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login/user'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
