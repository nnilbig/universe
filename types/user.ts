export type ProfileRole = 'player' | 'captain' | 'admin'

export interface Profile {
  id: string
  lineUserId?: string
  displayName: string
  avatarUrl?: string
  /** Account identity. 'captain'/'admin' unlock the edit-mode toggle; defaults to 'player'. */
  role: ProfileRole
  /** Stored balance (NT$), account-linked — 0 for a freshly created profile. */
  walletBalance: number
  createdAt: string
}

export interface AuthUser {
  profile: Profile | null
  isAuthenticated: boolean
  isGuestSession: boolean
}
