import type { AuthUser, Profile } from '~/types'

export interface AuthService {
  init(): Promise<void>
  getSession(): AuthUser
  loginWithLine(): Promise<Profile>
  logout(): Promise<void>
  /** "快速登入報名" consent step — binds the LINE identity and returns the resulting profile. */
  bindLineAccount(): Promise<Profile>
  /** Returns an unsubscribe function. */
  onSessionChange(cb: (user: AuthUser) => void): () => void
}
