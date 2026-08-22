import type { GuestRegisterPayload, Registration } from '~/types'

export interface RegistrationService {
  listByActivity(activityId: string): Registration[]
  registerWithLine(activityId: string, profileId: string): Promise<Registration>
  registerAsGuest(payload: GuestRegisterPayload): Promise<Registration[]>
  /** 補充報名 — adds one more member to an existing guest group (max 10 total). Never primary. */
  addGuestCompanion(groupId: string, nickname: string): Promise<Registration>
  setAvatar(registrationId: string, avatarUrl: string): Promise<void>
  /** nickname is required to cancel a guest registration (checked against the row); ignored for line registrations. */
  cancel(registrationId: string, nickname?: string): Promise<void>
  /** Organizer-only on-site check-in (核銷). No PIN required — gated by edit mode in the UI, not here. */
  setCheckedIn(registrationId: string, checkedIn: boolean): Promise<void>
  /**
   * All registrations belonging to the viewer, across every activity: LINE ones by profile id,
   * guest ones by the explicit id list the caller already tracked (e.g. via localStorage).
   * Async (unlike listByActivity) because a live implementation answers this with its own query
   * rather than a scan of whatever's already been fetched into a per-activity cache.
   */
  listMine(profileId: string | null, guestRegistrationIds: string[]): Promise<Registration[]>
}
