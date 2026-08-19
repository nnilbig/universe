import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** Lazily-created browser client, shared by every live service. */
export function getSupabaseClient(): SupabaseClient {
  if (client) return client

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const anonKey = config.public.supabaseAnonKey
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured — set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  })
  return client
}
