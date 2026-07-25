import type { Metadata, Viewport } from 'next'
import { Fredoka, Nunito } from 'next/font/google'
import './globals.css'

const display = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-display' })
const body = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Perpustakaan Griya Baca',
  description: 'Perpustakaan Digital Griya Baca - KKN Literasi'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2f8f52'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
