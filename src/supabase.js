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

export const supabaseConfigError = !isValidSupabaseUrl(supabaseUrl)
  ? 'Supabase URL is missing or invalid. Set VITE_SUPABASE_URL to your project URL in .env.local.'
  : !supabaseAnonKey
    ? 'Supabase key is missing. Set VITE_SUPABASE_ANON_KEY in .env.local.'
    : ''

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)