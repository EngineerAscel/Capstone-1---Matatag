import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isValidSupabaseUrl(value) {
  if (!value) return false

  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

function isServiceRoleKey(value) {
  const parts = value?.split('.')
  if (parts?.length !== 3) return false

  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    )
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

export const supabaseConfigError = !isValidSupabaseUrl(supabaseUrl)
  ? 'Supabase URL is missing or invalid. Set VITE_SUPABASE_URL to your project URL in .env.local.'
  : !supabaseAnonKey
    ? 'Supabase key is missing. Set VITE_SUPABASE_ANON_KEY in .env.local.'
    : isServiceRoleKey(supabaseAnonKey)
      ? 'A service_role key cannot be used in a browser app. Use the anon/public key instead.'
    : ''

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)