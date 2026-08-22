export type RegistrantKind = 'line' | 'guest'

export interface Registration {
  id: string
  activityId: string
  kind: RegistrantKind
  /** Groups guest registrations from the same 訪客報名 batch (1-4 members, growable via add_guest_companion); also set (to a unique value) for line registrations. */
  groupId: string
  /** Set when kind === 'guest'. The 主報名者 who started the group — shown as such in the member list, but cancelling them is otherwise the same as cancelling anyone else. Always false for kind === 'line'. */
  isPrimary: boolean
  /** Set when kind === 'line' */
  profileId?: string
  /** Set when kind === 'guest', max 8 characters. MVP has no PIN — this nickname is also what cancel_guest_registration checks against. */
  nickname?: string
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
  members: GuestRegisterMember[] // length 1-4
}
