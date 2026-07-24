// Helper pencatatan riwayat perubahan (activity_logs)
import type { SupabaseClient } from '@supabase/supabase-js'

type LogAction = 'create' | 'update' | 'delete' | 'import' | 'export' | 'reset_password' | 'login'

export async function writeLog(
  supabase: SupabaseClient,
  params: {
    userId?: string | null
    username?: string | null
    action: LogAction
    recordId?: string | null
    judul?: string | null
    before?: any
    after?: any
  }
) {
  try {
    await supabase.from('activity_logs').insert({
      user_id: params.userId ?? null,
      username: params.username ?? null,
      action: params.action,
      record_id: params.recordId ?? null,
      judul_buku: params.judul ?? null,
      data_before: params.before ?? null,
      data_after: params.after ?? null
    })
  } catch (e) {
    console.error('writeLog gagal', e)
  }
}
