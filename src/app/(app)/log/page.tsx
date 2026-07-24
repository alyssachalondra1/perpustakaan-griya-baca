import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ACTION_LABEL: Record<string, string> = {
  create: 'Tambah', update: 'Edit', delete: 'Hapus', import: 'Import',
  export: 'Export', reset_password: 'Reset Password', login: 'Login'
}

export default async function LogPage() {
  const supabase = createClient()
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Riwayat Perubahan</h1>
        <p className="text-sm text-slate-500">200 aktivitas terakhir pada sistem inventaris.</p>
      </div>

      <div className="space-y-2">
        {(logs || []).map((l: any) => (
          <details key={l.id} className="card">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
              <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{ACTION_LABEL[l.action] || l.action}</span>
              <span className="font-medium text-slate-800">{l.judul_buku || l.username || '-'}</span>
              <span className="ml-auto text-xs text-slate-400">{new Date(l.created_at).toLocaleString('id-ID')}</span>
            </summary>
            <div className="mt-2 text-xs text-slate-500">
              <p>Oleh: {l.username || l.user_id || '-'}</p>
              {l.data_before && <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2">Sebelum: {JSON.stringify(l.data_before, null, 2)}</pre>}
              {l.data_after && <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2">Sesudah: {JSON.stringify(l.data_after, null, 2)}</pre>}
            </div>
          </details>
        ))}
        {(!logs || logs.length === 0) && <p className="text-sm text-slate-400">Belum ada aktivitas.</p>}
      </div>
    </div>
  )
}
