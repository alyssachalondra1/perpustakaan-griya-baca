import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Perpustakaan Griya Baca',
  description: 'Sistem Inventaris Perpustakaan Griya Baca - KKN Literasi'
}

// Penting untuk tampilan mobile (scan via HP)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#217140'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
