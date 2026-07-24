// ============================================================================
//  IMPORT & EXPORT Excel - format PERSIS mengikuti 2 file referensi.
//  Urutan kolom TIDAK boleh berubah (syarat Perpusnas).
// ============================================================================
import * as XLSX from 'xlsx'
import type { Book } from '@/types'

// Header PERSIS "Buku Inventaris Perpustakaan dan TBM.xlsx" (10 kolom)
export const HEADER_TBM = [
  'Tanggal Terima', 'Nomor Inventaris', 'Judul Buku', 'Pengarang', 'Penerbit',
  'Tahun Terbit', 'Jumlah Eksemplar', 'Subjek', 'Sumber', 'Keterangan'
]

// Header PERSIS "Buku Inventaris FIX.xlsx" (13 kolom)
export const HEADER_FIX = [
  'Tanggal Terima', 'Nomor Inventaris', 'Judul Buku', 'Pengarang', 'Penerbit',
  'Tahun Terbit', 'Jumlah Eksemplar', 'Subjek', 'Sumber', 'Keterangan',
  'nomor klasifikasi', 'NM-PNGRNG', 'PRTM JDL'
]

function rowTbm(b: Book) {
  return [
    b.tanggal_terima || '', b.nomor_inventaris || '', b.judul_buku || '',
    b.pengarang || '', b.penerbit || '', b.tahun_terbit || '',
    b.jumlah_eksemplar ?? '', b.subjek || '', b.sumber || '', b.keterangan || ''
  ]
}
function rowFix(b: Book) {
  return [
    b.tanggal_terima || '', b.nomor_inventaris || '', b.judul_buku || '',
    b.pengarang || '', b.penerbit || '', b.tahun_terbit || '',
    b.jumlah_eksemplar ?? '', b.subjek || '', b.sumber || '', b.keterangan || '',
    b.nomor_klasifikasi || '', b.nm_pngrng || '', b.prtm_jdl || ''
  ]
}

export type ExportFormat = 'tbm' | 'fix'

export function buildWorkbook(books: Book[], format: ExportFormat): Uint8Array {
  const wb = XLSX.utils.book_new()
  if (format === 'tbm') {
    const aoa = [HEADER_TBM, ...books.map(rowTbm)]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Sheet1')
    const rekapMap = new Map<string, number>()
    for (const b of books) rekapMap.set(b.tanggal_terima, (rekapMap.get(b.tanggal_terima) || 0) + (b.jumlah_eksemplar || 0))
    const rekap = [['Rekapitulasi Inventarisasi Koleksi'], [], ['Tanggal', 'Jumlah'],
      ...[...rekapMap.entries()].sort().map(([t, j]) => [t, j])]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rekap), 'Sheet2')
  } else {
    const aoa = [HEADER_FIX, ...books.map(rowFix)]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Buku Inventaris FIX')
  }
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array
}

export interface ParsedRow { data: Partial<Book>; rowNumber: number; error?: string }
export interface ImportResult { total: number; valid: ParsedRow[]; failed: ParsedRow[]; detectedFormat: ExportFormat | 'unknown' }

function norm(s: any) { return String(s ?? '').trim().toLowerCase() }

export function parseWorkbook(buf: ArrayBuffer): ImportResult {
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false })
  if (aoa.length === 0) return { total: 0, valid: [], failed: [], detectedFormat: 'unknown' }

  const header = (aoa[0] as any[]).map(norm)
  const isFix = header.includes('nomor klasifikasi') || header.includes('nm-pngrng')
  const detectedFormat: ExportFormat | 'unknown' =
    header.includes('judul buku') ? (isFix ? 'fix' : 'tbm') : 'unknown'

  const idx = (name: string) => header.indexOf(norm(name))
  const col = {
    tanggal: idx('Tanggal Terima'), judul: idx('Judul Buku'),
    pengarang: idx('Pengarang'), penerbit: idx('Penerbit'), tahun: idx('Tahun Terbit'),
    jumlah: idx('Jumlah Eksemplar'), subjek: idx('Subjek'), sumber: idx('Sumber'),
    keterangan: idx('Keterangan'), klas: idx('nomor klasifikasi'),
    nm: idx('NM-PNGRNG'), jdl: idx('PRTM JDL')
  }

  const valid: ParsedRow[] = []
  const failed: ParsedRow[] = []
  for (let r = 1; r < aoa.length; r++) {
    const row = aoa[r] as any[]
    if (!row || row.every((c) => String(c ?? '').trim() === '')) continue
    const get = (i: number) => (i >= 0 ? row[i] : undefined)
    const data: Partial<Book> = {
      tanggal_terima: get(col.tanggal) ? String(get(col.tanggal)).slice(0, 10) : undefined,
      judul_buku: get(col.judul) ? String(get(col.judul)).trim() : '',
      pengarang: get(col.pengarang) ? String(get(col.pengarang)).trim() : '',
      penerbit: get(col.penerbit) ? String(get(col.penerbit)).trim() : '',
      tahun_terbit: get(col.tahun) ? String(get(col.tahun)).replace(/\.0$/, '').trim() : '',
      jumlah_eksemplar: get(col.jumlah) ? Number(get(col.jumlah)) : 1,
      subjek: get(col.subjek) ? String(get(col.subjek)).trim() : '',
      sumber: get(col.sumber) ? String(get(col.sumber)).trim() : '',
      keterangan: get(col.keterangan) ? String(get(col.keterangan)).trim() : '',
      nomor_klasifikasi: get(col.klas) ? String(get(col.klas)).trim() : '',
      nm_pngrng: get(col.nm) ? String(get(col.nm)).trim() : '',
      prtm_jdl: get(col.jdl) ? String(get(col.jdl)).trim() : ''
    }
    const missing: string[] = []
    if (!data.judul_buku) missing.push('Judul Buku')
    if (!data.pengarang) missing.push('Pengarang')
    if (missing.length > 0) failed.push({ data, rowNumber: r + 1, error: 'Kolom wajib kosong: ' + missing.join(', ') })
    else valid.push({ data, rowNumber: r + 1 })
  }
  return { total: valid.length + failed.length, valid, failed, detectedFormat }
}
