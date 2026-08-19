import type { AuthUser, Profile } from '~/types'
import type { AuthService } from './auth.types'
import { findProfileById } from '~/mocks/seed'

const MOCK_LINE_PROFILE_ID = 'profile-mock-line-user'
const MOCK_LATENCY_MS = 350

let session: AuthUser = { profile: null, isAuthenticated: false, isGuestSession: true }
const listeners = new Set<(user: AuthUser) => void>()

function setSession(next: AuthUser) {
  session = next
  listeners.forEach((cb) => cb(session))
}

function delay(ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loginAsMockLineUser(): Promise<Profile> {
  await delay()
  const profile = findProfileById(MOCK_LINE_PROFILE_ID)
  if (!profile) throw new Error('mock LINE profile fixture missing')
  setSession({ profile, isAuthenticated: true, isGuestSession: false })
  return profile
}

export const authServiceMock: AuthService = {
  async init() {
    await delay(150)
  },
  getSession() {
    return session
  },
  async loginWithLine() {
    return loginAsMockLineUser()
  },
  async logout() {
    await delay(150)
    setSession({ profile: null, isAuthenticated: false, isGuestSession: true })
  },
  async bindLineAccount() {
    // In mock mode, binding always succeeds after the consent step already shown in the UI.
    return loginAsMockLineUser()
  },
  onSessionChange(cb) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  }
}
