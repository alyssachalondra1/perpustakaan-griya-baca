// AI Vision memakai Google Gemini untuk membaca data buku dari foto:
// cover depan, cover belakang, dan HALAMAN KDT / hak cipta (yang memuat nomor DDC).
import type { Book } from '@/types'

const MODEL = 'gemini-3.1-flash-lite'

function stripDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = dataUrl.match(/^data:(.+?);base64,(.*)$/)
  if (m) return { mimeType: m[1], data: m[2] }
  return { mimeType: 'image/jpeg', data: dataUrl }
}

export async function readCovers(images: string[]): Promise<Partial<Book>> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY belum diatur')
  const base = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + key

  const prompt = [
    'Anda membaca beberapa foto dari sebuah buku. Foto bisa berupa:',
    '(a) sampul depan, (b) sampul belakang, dan (c) HALAMAN DALAM buku berisi blok KATALOG DALAM TERBITAN (KDT) / halaman hak cipta.',
    'Pada blok KDT ada kotak di kiri berisi (dari atas ke bawah): kode koleksi opsional (mis. "PB"), lalu NOMOR KLASIFIKASI DDC, lalu kode cutter huruf kapital (mis. "ABQ"), lalu satu huruf kecil judul (mis. "p").',
    'NOMOR KLASIFIKASI DDC adalah angka Dewey seperti "398.209 598", "372.21", atau "813.54". Angka ini BISA mengandung SPASI di dalamnya (mis. "398.209 598") - ambil SELURUH angkanya PERSIS seperti tercetak, TERMASUK spasi di tengah. JANGAN sertakan kode huruf cutter (seperti ABQ) atau huruf judul.',
    'Ekstrak metadata dan jawab HANYA dalam JSON valid tanpa penjelasan, dengan kunci:',
    '{"judul_buku": string, "pengarang": string, "penerbit": string, "tahun_terbit": string, "subjek": string, "deskripsi": string, "isbn": string, "nomor_klasifikasi": string}.',
    'Untuk nomor_klasifikasi isi HANYA angka DDC (boleh ada spasi di tengah), tanpa kode huruf. Jika suatu field tidak ditemukan/tidak yakin, isi string kosong.'
  ].join(' ')

  const parts: any[] = [{ text: prompt }]
  for (const img of images) {
    const { mimeType, data } = stripDataUrl(img)
    parts.push({ inline_data: { mime_type: mimeType, data } })
  }

  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.1 } })
  })
  if (!res.ok) throw new Error('Gemini gagal: ' + res.status)
  const json = await res.json()
  const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const match = text.match(/\{[\s\S]*\}/)
  let meta: any = {}
  if (match) { try { meta = JSON.parse(match[0]) } catch { meta = {} } }

  // Bersihkan DDC: buang huruf cutter/judul jika ikut terbaca, pertahankan angka + titik + spasi di tengah.
  let ddc = ''
  if (meta.nomor_klasifikasi) {
    ddc = String(meta.nomor_klasifikasi).replace(/[^0-9.\s]/g, '').replace(/\s+/g, ' ').trim()
  }

  return {
    judul_buku: meta.judul_buku || '',
    pengarang: meta.pengarang || '',
    penerbit: meta.penerbit || '',
    tahun_terbit: meta.tahun_terbit ? String(meta.tahun_terbit).slice(0, 4) : '',
    subjek: meta.subjek || '',
    deskripsi: meta.deskripsi || '',
    isbn: meta.isbn || '',
    nomor_klasifikasi: ddc
  }
}
