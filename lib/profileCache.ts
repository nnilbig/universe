import { reactive } from 'vue'
import type { Profile, ProfileRole } from '~/types'

// Shape of a row from the `profiles` table — see services/auth/auth.live.ts for the full schema note.
export interface ProfileRow {
  id: string
  line_user_id: string
  display_name: string
  avatar_url: string | null
  role: ProfileRole
  wallet_balance: number
  created_at: string
}

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    lineUserId: row.line_user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
    walletBalance: row.wallet_balance,
    createdAt: row.created_at
  }
}

// Populated as profiles are fetched by any live service (auth login, registration joins), so
// components that display a registrant's name/avatar can look them up synchronously — this is
// the live-mode counterpart to mocks/seed.ts's findProfileById. See useProfileLookup().
const cache = reactive(new Map<string, Profile>())

export function cacheProfiles(profiles: Profile[]) {
  for (const p of profiles) cache.set(p.id, p)
}

export function cacheProfileRows(rows: ProfileRow[]) {
  cacheProfiles(rows.map(mapProfileRow))
}

export function findCachedProfile(id: string): Profile | undefined {
  return cache.get(id)
}
