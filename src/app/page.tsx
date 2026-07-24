import Link from 'next/link'
import { getSessionProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await getSessionProfile()
  if (session) redirect('/dashboard')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-700 to-brand-900 px-4 text-center text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">PERPUSTAKAAN</h1>
        <h2 className="text-2xl font-bold sm:text-3xl">GRIYA BACA</h2>
        <p className="mt-3 text-sm text-brand-100">Sistem Inventaris Perpustakaan &middot; KKN Literasi</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link href="/login/admin" className="btn bg-white text-brand-800 hover:bg-brand-50">
          Masuk sebagai Admin
        </Link>
        <Link href="/login/user" className="btn border border-white/60 bg-transparent text-white hover:bg-white/10">
          Masuk / Daftar sebagai Pengunjung
        </Link>
      </div>
      <p className="mt-10 text-xs text-brand-200">perpustakaankkn298.my.id</p>
    </main>
  )
}
