export type Role = 'superadmin' | 'admin' | 'user'

export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  email: string | null
  avatar_url: string | null
  role: Role
  is_active: boolean
  created_at: string
}

export interface Book {
  id: string
  tanggal_terima: string
  nomor_inventaris: string | null
  judul_buku: string
  pengarang: string
  penerbit: string | null
  tahun_terbit: string | null
  jumlah_eksemplar: number
  subjek: string | null
  sumber: string | null
  keterangan: string | null
  nomor_klasifikasi: string | null
  nm_pngrng: string | null
  prtm_jdl: string | null
  perjenjangan: string | null
  isbn: string | null
  cover_url: string | null
  deskripsi: string | null
  input_method: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// DDC (nomor_klasifikasi) & perjenjangan TIDAK wajib: boleh dikosongkan dulu,
// dilengkapi admin kemudian (scan KDT / isi manual).
export const REQUIRED_FIELDS: (keyof Book)[] = [
  'judul_buku', 'pengarang', 'penerbit', 'tahun_terbit', 'jumlah_eksemplar'
]
