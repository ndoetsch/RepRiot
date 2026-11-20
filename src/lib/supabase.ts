import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True once the Supabase keys have been added (see .env.example). */
export const isConfigured = Boolean(url && anonKey)

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

/** Turns a Supabase or network error into a sentence a person can read. */
export function errorText(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: string }).message)
  return 'Something went wrong. Try again.'
}
