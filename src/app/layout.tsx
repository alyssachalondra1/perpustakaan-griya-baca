import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

// Font tegas & modern (bukan bulat). Dipakai untuk seluruh aplikasi.
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Perpustakaan Griya Baca',
  description: 'Sistem Inventaris Perpustakaan Griya Baca - KKN Literasi'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#217140'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={sans.variable}>
      <body>{children}</body>
    </html>
  )
}
