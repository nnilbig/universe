import { reactive } from 'vue'
import type { RegistrationService } from './registrations.types'
import type { Registration, RegistrantKind } from '~/types'
import { getSupabaseClient } from '~/lib/supabase'
import { cacheProfileRows, type ProfileRow } from '~/lib/profileCache'

// Backing table: registrations(id, activity_id, kind, group_id, is_primary, profile_id, nickname,
// avatar_url, checked_in, created_at). MVP guest flow has no PIN — ownership is asserted
// client-side via composables/useGuestNames.ts's localStorage list, and cancel_guest_registration
// just checks the submitted nickname against the row's actual nickname as a sanity check (not
// real auth; see supabase/migrations/20260821000000_guest_no_pin.sql). Guest groups can grow via
// add_guest_companion (補充報名, see supabase/migrations/20260821010000_guest_group_flow.sql).
// is_primary marks who started the group (shown as 主報名者) but cancelling them is otherwise
// the same as anyone else (see supabase/migrations/20260821020000_guest_cancel_no_cascade.sql):
//   register_guest(p_activity_id uuid, p_nicknames text[]) returns setof registrations
//   cancel_guest_registration(p_registration_id uuid, p_nickname text) returns void  -- raises on mismatch
//   add_guest_companion(p_group_id uuid, p_nickname text) returns registrations
// RLS: everyone may select; a LINE registrant may insert/delete/update only their own row
// (profile_id = auth.uid()); checked_in updates additionally require the caller to be the
// activity's organizer (or role admin/owner) — enforce that in the policy, not client-side.
interface RegistrationRow {
  id: string
  activity_id: string
  kind: RegistrantKind
  group_id: string
  is_primary: boolean
  profile_id: string | null
  nickname: string | null
  avatar_url: string | null
  checked_in: boolean
  created_at: string
  display_order: number
  // joined in via `select('*, profiles(*)')` for line registrations only — absent on realtime payloads.
  profiles?: ProfileRow | null
}

function mapRow(row: RegistrationRow): Registration {
  return {
    id: row.id,
    activityId: row.activity_id,
    kind: row.kind,
    groupId: row.group_id,
    isPrimary: row.is_primary,
    profileId: row.profile_id ?? undefined,
    nickname: row.nickname ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    checkedIn: row.checked_in,
    createdAt: row.created_at
  }
}

function cacheJoinedProfiles(rows: RegistrationRow[]) {
  const profiles = rows.map((r) => r.profiles).filter((p): p is ProfileRow => !!p)
  if (profiles.length) cacheProfileRows(profiles)
}

// Flat reactive list mirroring mocks/seed.ts's registrationsTable, so components reading
// listByActivity() inside a computed() re-render once a background fetch fills the cache in —
// same reactivity mechanism the mock relies on, just populated from Supabase instead of fixtures.
const cache = reactive<Registration[]>([])
const loadedActivityIds = new Set<string>()
const loadingActivityIds = new Set<string>()
const subscribedActivityIds = new Set<string>()

function upsertIntoCache(regs: Registration[]) {
  for (const reg of regs) {
    const idx = cache.findIndex((r) => r.id === reg.id)
    if (idx === -1) cache.push(reg)
    else cache[idx] = reg
  }
}

function removeFromCache(registrationId: string) {
  const idx = cache.findIndex((r) => r.id === registrationId)
  if (idx !== -1) cache.splice(idx, 1)
}

// Replaces this activity's slice of the cache with regs in the given order — unlike
// upsertIntoCache (which only adds/patches in place), this actually reorders, so a fresh fetch or
// a reorder() result is reflected in listByActivity()'s iteration order.
function setActivityOrder(activityId: string, regs: Registration[]) {
  for (let i = cache.length - 1; i >= 0; i--) {
    if (cache[i].activityId === activityId) cache.splice(i, 1)
  }
  cache.push(...regs)
}

async function fetchActivityRegistrations(activityId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('registrations')
    .select('*, profiles(*)')
    .eq('activity_id', activityId)
    .order('display_order')
  if (error) throw error
  const rows = data as RegistrationRow[]
  cacheJoinedProfiles(rows)
  setActivityOrder(activityId, rows.map(mapRow))
}

// Keeps check-ins and new registrations in sync across devices (the organizer check-in list is
// the main reason this matters — multiple phones may be checking people in at once). Realtime
// payloads don't include the joined `profiles` relation, so a registrant who isn't already cached
// (e.g. via auth.live.ts's own login) falls back to the "LINE" placeholder name until next fetch —
// the UI already handles a missing profile that way.
function subscribeToActivity(activityId: string) {
  if (subscribedActivityIds.has(activityId)) return
  subscribedActivityIds.add(activityId)
  const supabase = getSupabaseClient()
  supabase
    .channel(`registrations:${activityId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'registrations', filter: `activity_id=eq.${activityId}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldId = (payload.old as Partial<RegistrationRow>).id
          const idx = cache.findIndex((r) => r.id === oldId)
          if (idx !== -1) cache.splice(idx, 1)
          return
        }
        upsertIntoCache([mapRow(payload.new as RegistrationRow)])
      }
    )
    .subscribe()
}

function ensureLoaded(activityId: string) {
  if (loadedActivityIds.has(activityId) || loadingActivityIds.has(activityId)) return
  loadingActivityIds.add(activityId)
  fetchActivityRegistrations(activityId)
    .then(() => {
      loadedActivityIds.add(activityId)
      subscribeToActivity(activityId)
    })
    .catch((err) => console.error('[registrations.live] failed to load activity registrations', err))
    .finally(() => loadingActivityIds.delete(activityId))
}

export const registrationsServiceLive: RegistrationService = {
  listByActivity(activityId) {
    ensureLoaded(activityId)
    return cache.filter((r) => r.activityId === activityId)
  },
  async registerWithLine(activityId, profileId) {
    const existing = cache.find((r) => r.activityId === activityId && r.kind === 'line' && r.profileId === profileId)
    if (existing) return existing

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        activity_id: activityId,
        kind: 'line',
        group_id: crypto.randomUUID(),
        profile_id: profileId,
        checked_in: false
      })
      .select('*')
      .single()
    if (error) throw error
    const registration = mapRow(data as RegistrationRow)
    upsertIntoCache([registration])
    return registration
  },
  async registerAsGuest(payload) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('register_guest', {
      p_activity_id: payload.activityId,
      p_nicknames: payload.members.map((m) => m.nickname)
    })
    if (error) throw error
    const registrations = (data as RegistrationRow[]).map(mapRow)
    upsertIntoCache(registrations)
    return registrations
  },
  async addGuestCompanion(groupId, nickname) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('add_guest_companion', {
      p_group_id: groupId,
      p_nickname: nickname
    })
    if (error) throw error
    const registration = mapRow(data as RegistrationRow)
    upsertIntoCache([registration])
    return registration
  },
  async setAvatar(registrationId, avatarUrl) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('registrations').update({ avatar_url: avatarUrl }).eq('id', registrationId)
    if (error) throw error
    const idx = cache.findIndex((r) => r.id === registrationId)
    if (idx !== -1) cache[idx] = { ...cache[idx], avatarUrl }
  },
  async cancel(registrationId, nickname) {
    const supabase = getSupabaseClient()
    const registration = cache.find((r) => r.id === registrationId)

    if (registration?.kind === 'guest') {
      const { error } = await supabase.rpc('cancel_guest_registration', {
        p_registration_id: registrationId,
        p_nickname: nickname ?? ''
      })
      if (error) throw error
    } else {
      const { error } = await supabase.from('registrations').delete().eq('id', registrationId)
      if (error) throw error
    }

    removeFromCache(registrationId)
  },
  async setCheckedIn(registrationId, checkedIn) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('registrations').update({ checked_in: checkedIn }).eq('id', registrationId)
    if (error) throw error
    const idx = cache.findIndex((r) => r.id === registrationId)
    if (idx !== -1) cache[idx] = { ...cache[idx], checkedIn }
  },
  async listMine(profileId, guestRegistrationIds) {
    const orParts: string[] = []
    if (profileId) orParts.push(`profile_id.eq.${profileId}`)
    if (guestRegistrationIds.length) orParts.push(`id.in.(${guestRegistrationIds.join(',')})`)
    if (!orParts.length) return []

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('registrations').select('*, profiles(*)').or(orParts.join(','))
    if (error) throw error
    const rows = data as RegistrationRow[]
    cacheJoinedProfiles(rows)
    const registrations = rows.map(mapRow)
    upsertIntoCache(registrations)
    return registrations
  },
  async reorder(activityId, orderedIds) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc('reorder_registrations', {
      p_activity_id: activityId,
      p_ids: orderedIds
    })
    if (error) throw error
    const registrations = (data as RegistrationRow[]).map(mapRow)
    setActivityOrder(activityId, registrations)
    return registrations
  }
}
