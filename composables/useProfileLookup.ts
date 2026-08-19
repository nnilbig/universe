import type { Profile } from '~/types'
import { findProfileById } from '~/mocks/seed'
import { findCachedProfile } from '~/lib/profileCache'

/** Resolves another registrant's profile for display — mock table lookup or live-mode cache. */
export function useProfileLookup(): (id: string) => Profile | undefined {
  const config = useRuntimeConfig()
  return config.public.authMode === 'live' ? findCachedProfile : findProfileById
}
