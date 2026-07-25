// ============================================================================
//  Cari GAMBAR COVER buku berdasarkan JUDUL dari internet (GRATIS, tanpa
//  perlu setup Google Cloud / API key khusus).
//  Urutan pencarian (berhenti di yang pertama ketemu):
//   1) Google Books (by judul)
//   2) OpenLibrary (by judul)
//   3) Apple Books / iTunes (by judul)
//   4) Google Images (Programmable Search) - HANYA jika GOOGLE_CSE_ID diisi.
//      Catatan: Google sudah men-deprecate opsi "Search the entire web"
//      untuk search engine baru, jadi langkah ini opsional & sering dilewati.
// ============================================================================

export type CoverResult = { cover_url: string; source: string } | null

// 1) Google Books (cari berdasarkan judul). Gratis, tanpa key wajib.
async function fromGoogleBooks(query: string): Promise<string> {
  const key = process.env.GOOGLE_BOOKS_API_KEY
  const base =
    'https://www.googleapis.com/books/v1/volumes?maxResults=3&q=' +
    encodeURIComponent('intitle:' + query)
  const res = await fetch(key ? base + '&key=' + key : base)
  if (!res.ok) return ''
  const json = await res.json()
  for (const it of json.items || []) {
    const l = it.volumeInfo?.imageLinks
    const c = l?.thumbnail || l?.smallThumbnail
    if (c) return String(c).replace('http://', 'https://')
  }
  return ''
}

// 2) OpenLibrary (cari berdasarkan judul). Gratis, tanpa key.
async function fromOpenLibrary(title: string): Promise<string> {
  const res = await fetch('https://openlibrary.org/search.json?limit=3&title=' + encodeURIComponent(title))
  if (!res.ok) return ''
  const json = await res.json()
  for (const d of json.docs || []) {
    if (d.cover_i) return 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg'
    if (Array.isArray(d.isbn) && d.isbn[0]) return 'https://covers.openlibrary.org/b/isbn/' + d.isbn[0] + '-L.jpg'
  }
  return ''
}

// 3) Apple Books / iTunes Search (cari berdasarkan judul). Gratis, tanpa key.
async function fromAppleBooks(query: string): Promise<string> {
  const res = await fetch('https://itunes.apple.com/search?media=ebook&limit=3&term=' + encodeURIComponent(query))
  if (!res.ok) return ''
  const json = await res.json()
  for (const r of json.results || []) {
    const art = r.artworkUrl100 || r.artworkUrl60
    if (art) return String(art).replace('100x100bb', '600x600bb').replace('60x60bb', '600x600bb')
  }
  return ''
}

// 4) Google Images via Programmable Search Engine. OPSIONAL (butuh GOOGLE_CSE_ID).
async function fromGoogleImages(query: string): Promise<string> {
  const cx = process.env.GOOGLE_CSE_ID
  const key = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_BOOKS_API_KEY
  if (!cx || !key) return '' // tidak dikonfigurasi -> dilewati
  const url =
    'https://www.googleapis.com/customsearch/v1' +
    '?key=' + key + '&cx=' + cx + '&searchType=image&num=6&safe=active&q=' + encodeURIComponent(query)
  const res = await fetch(url)
  if (!res.ok) return ''
  const json = await res.json()
  const items: any[] = Array.isArray(json.items) ? json.items : []
  for (const it of items) {
    const link = it.link as string
    const img = it.image || {}
    if (!link) continue
    if (img.height && img.width && img.height < img.width) continue // lewati landscape
    return link
  }
  return items[0]?.link || ''
}

export async function searchCoverByTitle(title: string, author?: string): Promise<CoverResult> {
  const t = (title || '').trim()
  if (!t) return null
  const q = [t, author].filter(Boolean).join(' ')

  try {
    const gb = await fromGoogleBooks(q)
    if (gb) return { cover_url: gb, source: 'google-books' }
  } catch {}
  try {
    const ol = await fromOpenLibrary(t)
    if (ol) return { cover_url: ol, source: 'openlibrary' }
  } catch {}
  try {
    const ab = await fromAppleBooks(q)
    if (ab) return { cover_url: ab, source: 'apple-books' }
  } catch {}
  try {
    const g = await fromGoogleImages(q + ' sampul buku')
    if (g) return { cover_url: g, source: 'google-images' }
  } catch {}
  return null
}
