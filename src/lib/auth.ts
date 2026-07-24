import { createClient } from './supabase/server'
import type { Profile } from '@/types'

/** Ambil user + profile (peran) yang sedang login di sisi server. */
export async function getSessionProfile(): Promise<{ userId: string; profile: Profile } | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) return null
  return { userId: user.id, profile: profile as Profile }
}

export function isStaff(role?: string) { return role === 'admin' || role === 'superadmin' }
export function isSuperadmin(role?: string) { return role === 'superadmin' }
