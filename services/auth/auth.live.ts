import type { AuthUser, Profile } from '~/types'
import type { AuthService } from './auth.types'
import liff from '@line/liff'
import { getSupabaseClient } from '~/lib/supabase'
import { mapProfileRow, cacheProfiles, type ProfileRow } from '~/lib/profileCache'

// Backing table: profiles (id uuid primary key references auth.users(id) on delete cascade,
// line_user_id text unique not null, display_name text not null, avatar_url text, role text
// not null default 'player', wallet_balance integer not null default 0,
// created_at timestamptz not null default now()).
// RLS: users may select/insert/update only the row where id = auth.uid().

interface LineLoginResponse {
  email: string
  hashedToken: string
}

let session: AuthUser = { profile: null, isAuthenticated: false, isGuestSession: true }
const listeners = new Set<(user: AuthUser) => void>()
let liffInitialized = false

function setSession(next: AuthUser) {
  session = next
  listeners.forEach((cb) => cb(session))
}

async function ensureProfile(
  userId: string,
  line: { sub: string; name?: string; picture?: string }
): Promise<Profile> {
  const supabase = getSupabaseClient()
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (selectError) throw selectError
  if (existing) {
    const profile = mapProfileRow(existing as ProfileRow)
    cacheProfiles([profile])
    return profile
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      line_user_id: line.sub,
      display_name: line.name ?? '訪客',
      avatar_url: line.picture ?? null,
      role: 'player'
    })
    .select('*')
    .single()
  if (insertError) throw insertError
  const profile = mapProfileRow(inserted as ProfileRow)
  cacheProfiles([profile])
  return profile
}

async function syncFromSupabaseSession(): Promise<void> {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) {
    setSession({ profile: null, isAuthenticated: false, isGuestSession: true })
    return
  }
  const meta = user.user_metadata as { line_sub?: string; name?: string; picture?: string }
  const profile = await ensureProfile(user.id, {
    sub: meta.line_sub ?? user.id,
    name: meta.name,
    picture: meta.picture
  })
  setSession({ profile, isAuthenticated: true, isGuestSession: false })
}

/**
 * Runs LIFF login, exchanges the verified ID token via the `line-login` Edge Function, then
 * redeems the resulting one-time token client-side with verifyOtp(). See
 * supabase/functions/line-login for the server half of this bridge — Supabase's
 * signInWithIdToken() only covers its built-in provider list, and custom OIDC providers there
 * are redirect-only (signInWithOAuth), which doesn't fit LIFF's own in-app login flow.
 */
async function loginAndSync(): Promise<Profile> {
  if (!liff.isLoggedIn()) {
    liff.login()
    // liff.login() navigates the page away (or completes in place inside the LINE client);
    // either way this call site doesn't resolve — the app re-runs init() after the redirect.
    return new Promise<Profile>(() => {})
  }

  const idToken = liff.getIDToken()
  if (!idToken) {
    throw new Error('LIFF session has no ID token — check the LIFF app requests the "openid" scope')
  }

  const supabase = getSupabaseClient()
  const { data: fnData, error: fnError } = await supabase.functions.invoke<LineLoginResponse>('line-login', {
    body: { idToken }
  })
  if (fnError) throw fnError
  if (!fnData) throw new Error('line-login returned no data')

  // type must match what generateLink() was called with server-side ('magiclink') — verifyOtp
  // looks up the stored token by (email, type), so a mismatched type here always reads back as
  // "expired or invalid" even though the token itself is fine.
  const { error: otpError } = await supabase.auth.verifyOtp({
    email: fnData.email,
    token: fnData.hashedToken,
    type: 'magiclink'
  })
  if (otpError) throw otpError

  await syncFromSupabaseSession()
  if (!session.profile) throw new Error('Supabase session established but profile sync failed')
  return session.profile
}

export const authServiceLive: AuthService = {
  async init() {
    const config = useRuntimeConfig()
    if (!config.public.liffId) throw new Error('NUXT_PUBLIC_LIFF_ID is not set')
    if (!liffInitialized) {
      await liff.init({ liffId: config.public.liffId })
      liffInitialized = true
    }

    if (!liff.isLoggedIn()) {
      setSession({ profile: null, isAuthenticated: false, isGuestSession: true })
      return
    }

    const supabase = getSupabaseClient()
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      await syncFromSupabaseSession()
      return
    }

    // liff.login() already completed — most likely we just landed back from its redirect — but
    // the Supabase half of the bridge hasn't run yet. Finish it now instead of leaving the user
    // stuck in a logged-out-looking state until they tap the login button a second time.
    try {
      await loginAndSync()
    } catch (err) {
      console.error('[auth.live] failed to complete deferred LINE login', err)
      setSession({ profile: null, isAuthenticated: false, isGuestSession: true })
    }
  },
  getSession() {
    return session
  },
  async loginWithLine() {
    return loginAndSync()
  },
  async logout() {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    if (liff.isLoggedIn()) liff.logout()
    setSession({ profile: null, isAuthenticated: false, isGuestSession: true })
  },
  async bindLineAccount() {
    return loginAndSync()
  },
  onSessionChange(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  }
}
