// Server half of the auth.live.ts LINE→Supabase bridge (see that file for why this exists
// instead of signInWithIdToken/signInWithOAuth). Deploy with:
//   supabase functions deploy line-login
//   supabase secrets set LINE_CHANNEL_ID=<your LINE Login channel id>
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically in the function runtime.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const LINE_VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify'

// The browser calls this function directly (not through a same-origin proxy), so every response —
// including the preflight OPTIONS request Supabase's gateway does NOT handle for you — needs
// CORS headers, or the browser drops the response before the app ever sees it.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

interface LineIdTokenClaims {
  sub: string
  aud: string
  name?: string
  picture?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method not allowed' }, 405)
  }

  const channelId = Deno.env.get('LINE_CHANNEL_ID')
  if (!channelId) {
    return jsonResponse({ error: 'LINE_CHANNEL_ID is not configured' }, 500)
  }

  const body = await req.json().catch(() => null)
  const idToken = body?.idToken
  if (typeof idToken !== 'string' || !idToken) {
    return jsonResponse({ error: 'idToken is required' }, 400)
  }

  // Verify against LINE's own endpoint rather than trusting client-decoded claims — this also
  // confirms the token was issued for *this* LIFF channel (aud check below).
  const verifyRes = await fetch(LINE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId })
  })
  if (!verifyRes.ok) {
    return jsonResponse({ error: 'LINE ID token verification failed' }, 401)
  }
  const claims = (await verifyRes.json()) as LineIdTokenClaims
  if (claims.aud !== channelId) {
    return jsonResponse({ error: 'token audience mismatch' }, 401)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Supabase Auth has no native LINE provider, so identity is bridged through a deterministic
  // pseudo-email tied to the LINE user id. generateLink() creates the auth user on first login;
  // on later logins it just re-issues a redeemable token for the same user.
  const email = `line-${claims.sub}@users.whonext.internal`
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (linkError || !linkData) {
    return jsonResponse({ error: linkError?.message ?? 'generateLink failed' }, 500)
  }

  // Stamp fresh LINE profile info on every login rather than relying on generateLink's
  // creation-time metadata, so display name/avatar changes on LINE's side stay in sync.
  const { error: updateError } = await admin.auth.admin.updateUserById(linkData.user.id, {
    user_metadata: { line_sub: claims.sub, name: claims.name, picture: claims.picture }
  })
  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500)
  }

  return jsonResponse({ email, hashedToken: linkData.properties.hashed_token })
})
