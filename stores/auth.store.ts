import { defineStore } from 'pinia'
import type { AuthUser, Profile } from '~/types'

interface AuthState extends AuthUser {
  /** UI-only concern, not part of AuthUser/AuthService — always resets to 'player' on session change. */
  viewMode: 'player' | 'edit'
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    profile: null,
    isAuthenticated: false,
    isGuestSession: true,
    viewMode: 'player'
  }),
  getters: {
    // Host activities, manually add/remove registrants, check in attendees, manage wallet
    // balances — everything admin/owner share.
    canToggleViewMode: (state) => state.profile?.role === 'admin' || state.profile?.role === 'owner',
    // Owner-only: assigning the 'admin' role to other accounts.
    isOwner: (state) => state.profile?.role === 'owner'
  },
  actions: {
    setSession(session: AuthUser) {
      this.profile = session.profile
      this.isAuthenticated = session.isAuthenticated
      this.isGuestSession = session.isGuestSession
      this.viewMode = 'player'
    },
    setProfile(profile: Profile) {
      this.profile = profile
      this.isAuthenticated = true
      this.isGuestSession = false
      this.viewMode = 'player'
    },
    clear() {
      this.profile = null
      this.isAuthenticated = false
      this.isGuestSession = true
      this.viewMode = 'player'
    },
    toggleViewMode() {
      if (!this.canToggleViewMode) return
      this.viewMode = this.viewMode === 'player' ? 'edit' : 'player'
    }
  }
})
