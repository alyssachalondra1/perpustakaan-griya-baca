// Ambil metadata buku dari Google Books API berdasarkan ISBN.
import type { Book } from '@/types'

export async function fetchByIsbn(isbn: string): Promise<Partial<Book> | null> {
  const clean = isbn.replace(/[^0-9Xx]/g, '')
  const key = process.env.GOOGLE_BOOKS_API_KEY
  const base = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' + encodeURIComponent(clean)
  const res = await fetch(key ? base + '&key=' + key : base)
  if (res.ok) {
    const json = await res.json()
    if (json.items && json.items.length > 0) {
      const v = json.items[0].volumeInfo || {}
      const cover = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || ''
      return {
        judul_buku: v.title || '',
        pengarang: Array.isArray(v.authors) ? v.authors.join(', ') : (v.authors || ''),
        penerbit: v.publisher || '',
        tahun_terbit: v.publishedDate ? String(v.publishedDate).slice(0, 4) : '',
        subjek: Array.isArray(v.categories) ? v.categories.join(', ') : '',
        deskripsi: v.description || '',
        isbn: clean,
        cover_url: cover ? cover.replace('http://', 'https://') : ''
      }
    }
  }
  // Fallback: OpenLibrary (lebih lengkap untuk buku lokal/non-Inggris)
  try {
    const ol = await fetch('https://openlibrary.org/api/books?bibkeys=ISBN:' + clean + '&format=json&jscmd=data')
    if (ol.ok) {
      const j = await ol.json()
      const it = j['ISBN:' + clean]
      if (it) {
        return {
          judul_buku: it.title || '',
          pengarang: Array.isArray(it.authors) ? it.authors.map((a: any) => a.name).join(', ') : '',
          penerbit: Array.isArray(it.publishers) ? it.publishers.map((p: any) => p.name).join(', ') : '',
          tahun_terbit: it.publish_date ? (String(it.publish_date).match(/\d{4}/)?.[0] || '') : '',
          subjek: Array.isArray(it.subjects) ? it.subjects.slice(0, 3).map((s: any) => s.name).join(', ') : '',
          deskripsi: typeof it.notes === 'string' ? it.notes : '',
          isbn: clean,
          cover_url: it.cover?.medium || it.cover?.large || it.cover?.small || ''
        }
      }
    }
  } catch {}
  return null
}
