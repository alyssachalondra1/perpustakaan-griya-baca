// ============================================================================
//  SEED AKUN AWAL - jalankan: npm run seed
//  Membuat 1 superadmin + 8 admin. Butuh .env.local terisi.
// ============================================================================
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// muat .env.local sederhana
try {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
  }
} catch { console.warn('Tidak menemukan .env.local, memakai env sistem.') }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const domain = process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN || 'griyabaca.local'

if (!url || !serviceKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

async function upsertUser(username, password, fullName, role) {
  const email = username + '@' + domain
  const { data: created, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { username, full_name: fullName, role }
  })
  if (error) {
    if (String(error.message).toLowerCase().includes('already')) {
      console.log('- ' + username + ' sudah ada, dilewati.')
      return
    }
    console.error('Gagal membuat ' + username + ':', error.message)
    return
  }
  await admin.from('profiles').update({ username, full_name: fullName, role }).eq('id', created.user.id)
  console.log('+ ' + role + ': ' + username + ' / ' + password)
}

async function main() {
  console.log('Membuat akun awal...')
  await upsertUser('superadmin', 'SuperAdmin123!', 'Admin Utama', 'superadmin')
  for (let i = 1; i <= 8; i++) {
    const uname = 'admin' + String(i).padStart(2, '0')
    await upsertUser(uname, 'Admin123!', 'Admin ' + i, 'admin')
  }
  console.log('Selesai. Segera ganti password default setelah login pertama.')
}
main()
