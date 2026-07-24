'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteButton({ id, judul }: { id: string; judul: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function del() {
    if (!confirm(`Hapus buku "${judul}"? Tindakan ini tercatat di riwayat.`)) return
    setLoading(true)
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) { router.push('/katalog'); router.refresh() }
    else alert('Gagal menghapus buku.')
  }

  return <button onClick={del} disabled={loading} className="btn-danger">{loading ? 'Menghapus...' : 'Hapus'}</button>
}
