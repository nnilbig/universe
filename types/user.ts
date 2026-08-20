// 'player' (一般) and 'subscriber' (訂閱) currently behave identically — subscriber tiering isn't
// built yet, this just reserves the value. 訪客 (guest) isn't a role: it's an unauthenticated
// session (AuthUser.isGuestSession), so guests never hold a profiles row/role at all — the guest
// PIN registration flow (registerAsGuest) is exactly the "not quick registration" path for them.
export type ProfileRole = 'player' | 'subscriber' | 'admin' | 'owner'

export interface Profile {
  id: string
  lineUserId?: string
  displayName: string
  avatarUrl?: string
  /** Account identity. 'admin'/'owner' unlock host/check-in/wallet/registrant-management powers
   *  and the edit-mode toggle; 'owner' can additionally assign the 'admin' role. Defaults to 'player'. */
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
