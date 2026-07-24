// AI Vision memakai Google Gemini untuk membaca data buku dari foto cover.
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

  const prompt = 'Anda membaca foto sampul buku (depan dan/atau belakang). Ekstrak metadata dan jawab HANYA dalam JSON valid tanpa penjelasan, dengan kunci: {"judul_buku": string, "pengarang": string, "penerbit": string, "tahun_terbit": string, "subjek": string, "deskripsi": string, "isbn": string}. Jika tidak yakin pada suatu field, isi string kosong.'

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
  return {
    judul_buku: meta.judul_buku || '',
    pengarang: meta.pengarang || '',
    penerbit: meta.penerbit || '',
    tahun_terbit: meta.tahun_terbit ? String(meta.tahun_terbit).slice(0, 4) : '',
    subjek: meta.subjek || '',
    deskripsi: meta.deskripsi || '',
    isbn: meta.isbn || ''
  }
}
