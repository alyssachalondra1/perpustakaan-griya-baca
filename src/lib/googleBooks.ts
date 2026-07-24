// Ambil metadata buku dari Google Books API berdasarkan ISBN.
import type { Book } from '@/types'

export async function fetchByIsbn(isbn: string): Promise<Partial<Book> | null> {
  const clean = isbn.replace(/[^0-9Xx]/g, '')
  const key = process.env.GOOGLE_BOOKS_API_KEY
  const base = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' + encodeURIComponent(clean)
  const url = key ? base + '&key=' + key : base
  const res = await fetch(url)
  if (!res.ok) throw new Error('Google Books gagal: ' + res.status)
  const json = await res.json()
  if (!json.items || json.items.length === 0) return null
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
