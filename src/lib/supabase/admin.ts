import { createClient } from '@supabase/supabase-js'

// Klien service-role (hanya dipakai di server, untuk aksi admin seperti
// membuat akun & reset password). JANGAN pernah diekspos ke browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
