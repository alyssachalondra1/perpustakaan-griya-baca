// ============================================================================
//  Aturan klasifikasi & kode buku (mengikuti pola perpustakaan pada file FIX)
//  Nomor panggil = [Nomor Klasifikasi DDC] + [NM-PNGRNG] + [PRTM JDL]
//  Contoh: 398.280 2  |  ODO  |  n
// ============================================================================

const STOPWORDS = ['the', 'a', 'an', 'la', 'le', 'el']

/** NM-PNGRNG: 3 huruf pertama nama BELAKANG pengarang, KAPITAL. */
export function nmPngrng(pengarang: string): string {
  if (!pengarang) return ''
  const clean = pengarang.trim().replace(/\s+/g, ' ')
  const parts = clean.split(' ').filter(Boolean)
  const last = parts.length > 0 ? parts[parts.length - 1] : ''
  return last.replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 3).toUpperCase()
}

/** PRTM JDL: 1 huruf pertama judul (kecil), abaikan kata sandang. */
export function prtmJdl(judul: string): string {
  if (!judul) return ''
  const words = judul.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const first = words.find((w) => !STOPWORDS.includes(w)) || words[0] || ''
  const m = first.match(/[a-zà-ÿ0-9]/)
  return m ? m[0] : ''
}

/** Nomor panggil lengkap untuk label. */
export function nomorPanggil(nomorKlasifikasi: string, nm: string, jdl: string): string[] {
  return [nomorKlasifikasi || '', nm || '', jdl || ''].map((s) => s.trim())
}

const DDC_HINTS: { key: RegExp; ddc: string; label: string }[] = [
  { key: /(cerita rakyat|dongeng|folklor|fabel|legenda)/i, ddc: '398.2', label: 'Cerita rakyat' },
  { key: /(agama|islam|al-?quran|hadis)/i, ddc: '2X0', label: 'Agama Islam' },
  { key: /(kristen|alkitab|injil)/i, ddc: '230', label: 'Kristen' },
  { key: /(matematika|aljabar|geometri)/i, ddc: '510', label: 'Matematika' },
  { key: /(sains|ilmu pengetahuan alam|ipa|fisika)/i, ddc: '500', label: 'Sains' },
  { key: /(biologi|hewan|tumbuhan)/i, ddc: '570', label: 'Biologi' },
  { key: /(teknologi|komputer|informatika)/i, ddc: '000', label: 'Komputer/Informasi' },
  { key: /(sejarah)/i, ddc: '900', label: 'Sejarah' },
  { key: /(geografi|atlas)/i, ddc: '910', label: 'Geografi' },
  { key: /(bahasa|kamus|grammar|tata bahasa)/i, ddc: '400', label: 'Bahasa' },
  { key: /(sastra|puisi|novel|cerpen|roman)/i, ddc: '800', label: 'Sastra' },
  { key: /(seni|musik|lukis|gambar)/i, ddc: '700', label: 'Seni' },
  { key: /(sosial|ekonomi|politik|hukum)/i, ddc: '300', label: 'Ilmu Sosial' },
  { key: /(filsafat|psikologi)/i, ddc: '100', label: 'Filsafat/Psikologi' }
]

export function suggestDdc(subjek?: string, judul?: string): { ddc: string; label: string } | null {
  const text = `${subjek || ''} ${judul || ''}`
  for (const h of DDC_HINTS) if (h.key.test(text)) return { ddc: h.ddc, label: h.label }
  return null
}
