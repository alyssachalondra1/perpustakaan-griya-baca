import { getSessionProfile, isStaff } from '@/lib/auth'
import PublicHeader from '@/components/PublicHeader'
import LibraryBrowser from '@/components/LibraryBrowser'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await getSessionProfile()
  const user = session
    ? { name: session.profile.full_name || session.profile.username || 'Pengguna', isStaff: isStaff(session.profile.role) }
    : null

  return (
    <>
      <PublicHeader user={user} />

      <section className="bg-gradient-to-b from-brand-400 to-brand-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:py-14">
          <span className="mb-3 inline-block rounded-full bg-white/20 px-4 py-1 text-xs font-bold">📚 Perpustakaan Digital</span>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">Selamat Datang di<br />Perpustakaan Ibnu Abbas</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-brand-50 sm:text-base">Mulai jelajahi koleksi buku kami secara gratis &mdash; tanpa perlu membuat akun! Punya akun? Kamu bisa menyimpan buku favoritmu.</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <LibraryBrowser />
      </main>

      <footer className="pb-10 pt-4 text-center text-xs text-slate-400">
        Perpustakaan Ibnu Abbas &middot; KKN Literasi &middot; perpustakaankkn298.my.id
      </footer>
    </>
  )
}
