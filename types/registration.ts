export type RegistrantKind = 'line' | 'guest'

export interface Registration {
  id: string
  activityId: string
  kind: RegistrantKind
  /** Groups guest registrations that share one PIN (1-4 members); also set (to a unique value) for line registrations. */
  groupId: string
  /** Set when kind === 'line' */
  profileId?: string
  /** Set when kind === 'guest', max 4 characters */
  nickname?: string
  /** Set when kind === 'guest'. Never store the raw PIN, even in the mock service. */
  pinHash?: string
  avatarUrl?: string
  /** Set by the organizer on-site check-in (核銷). Defaults to false. */
  checkedIn: boolean
  createdAt: string
}

export interface GuestRegisterMember {
  nickname: string
}

export interface GuestRegisterPayload {
  activityId: string
  pin: string
  members: GuestRegisterMember[] // length 1-4, one shared PIN
}
