import { storeToRefs } from 'pinia'
import type { AuthService } from '~/services/auth/auth.types'
import { authServiceMock } from '~/services/auth/auth.mock'
import { authServiceLive } from '~/services/auth/auth.live'

function resolveAuthService(): AuthService {
  const config = useRuntimeConfig()
  return config.public.authMode === 'live' ? authServiceLive : authServiceMock
}

export function useAuth() {
  const service = resolveAuthService()
  const store = useAuthStore()
  const { profile, isAuthenticated, isGuestSession, viewMode, canToggleViewMode, isOwner } = storeToRefs(store)

  async function init() {
    await service.init()
    store.setSession(service.getSession())
    service.onSessionChange((session) => store.setSession(session))
  }

  async function loginWithLine() {
    const profile = await service.loginWithLine()
    store.setProfile(profile)
    return profile
  }

  async function bindLineAccount() {
    const profile = await service.bindLineAccount()
    store.setProfile(profile)
    return profile
  }

  async function logout() {
    await service.logout()
    store.clear()
  }

  return {
    profile,
    isAuthenticated,
    isGuestSession,
    viewMode,
    canToggleViewMode,
    isOwner,
    init,
    loginWithLine,
    bindLineAccount,
    logout,
    toggleViewMode: store.toggleViewMode
  }
}
