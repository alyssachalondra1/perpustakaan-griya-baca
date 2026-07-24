'use client'

// Dua tombol export sesuai syarat Perpusnas: format TBM (10 kolom) & FIX (13 kolom).
export default function ExportButtons() {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <a href="/api/export?format=tbm" className="btn-outline">⬇️ Export Excel &mdash; Format TBM (10 kolom)</a>
      <a href="/api/export?format=fix" className="btn-outline">⬇️ Export Excel &mdash; Format FIX (13 kolom)</a>
    </div>
  )
}
