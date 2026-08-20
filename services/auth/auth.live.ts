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

let loginPromise: Promise<Profile> | null = null

/**
 * Runs LIFF login, exchanges the verified ID token via the `line-login` Edge Function, then
 * redeems the resulting one-time token client-side with verifyOtp(). See
 * supabase/functions/line-login for the server half of this bridge — Supabase's
 * signInWithIdToken() only covers its built-in provider list, and custom OIDC providers there
 * are redirect-only (signInWithOAuth), which doesn't fit LIFF's own in-app login flow.
 *
 * De-duped via loginPromise: the magic-link token this mints is single-use, and Supabase
 * returns the same token for repeat requests within its request-rate window, so two overlapping
 * calls (e.g. init()'s auto-continue racing a manual button tap) would have the second consume a
 * token the first already redeemed, always failing as "expired or invalid" no matter how fresh
 * the underlying LINE login actually was.
 */
function loginAndSync(): Promise<Profile> {
  if (!liff.isLoggedIn()) {
    liff.login()
    // liff.login() navigates the page away (or completes in place inside the LINE client);
    // either way this call site doesn't resolve — the app re-runs init() after the redirect. Kept
    // outside the loginPromise cache below: if navigation somehow doesn't happen this call must
    // not permanently wedge every future login attempt behind a promise that will never settle.
    return new Promise<Profile>(() => {})
  }
  if (!loginPromise) {
    loginPromise = doLoginAndSync().finally(() => {
      loginPromise = null
    })
  }
  return loginPromise
}

async function doLoginAndSync(): Promise<Profile> {
  const idToken = liff.getIDToken()
  if (!idToken) {
    throw new Error('LIFF session has no ID token — check the LIFF app requests the "openid" scope')
  }

  try {
    const supabase = getSupabaseClient()
    const { data: fnData, error: fnError } = await supabase.functions.invoke<LineLoginResponse>('line-login', {
      body: { idToken }
    })
    if (fnError) throw fnError
    if (!fnData) throw new Error('line-login returned no data')

    // generateLink()'s `hashed_token` is a token HASH — the auth-js `{ email, token, type }` verify
    // form expects `token` to be the plaintext OTP (what gets emailed to users), a completely
    // different value. Pairing a hash with that form can never match and always reads back as
    // "expired or invalid" no matter how fresh the link is. The hash has its own verify form:
    // `{ token_hash, type }`, no email needed.
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: fnData.hashedToken,
      type: 'magiclink'
    })
    if (otpError) throw otpError

    await syncFromSupabaseSession()
    if (!session.profile) throw new Error('Supabase session established but profile sync failed')
    return session.profile
  } catch (err) {
    // liff.getIDToken() returns whatever was cached at the last liff.login(), which doesn't
    // auto-refresh — once it's past LINE's own expiry, every retry keeps failing with the exact
    // same dead token and liff.isLoggedIn() never goes false on its own to unstick it. Clearing
    // the LIFF session here means the next login attempt does a real liff.login() redirect and
    // comes back with a fresh token, instead of looping on the same expired one forever.
    if (liff.isLoggedIn()) liff.logout()
    throw err
  }
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
