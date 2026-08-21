import type { GuestRegisterPayload, Registration } from '~/types'
import type { RegistrationService } from '~/services/registrations/registrations.types'
import { registrationsServiceMock } from '~/services/registrations/registrations.mock'
import { registrationsServiceLive } from '~/services/registrations/registrations.live'

function resolveRegistrationService(): RegistrationService {
  const config = useRuntimeConfig()
  return config.public.authMode === 'live' ? registrationsServiceLive : registrationsServiceMock
}

interface GuestRegistrationRecord {
  groupId: string
  registrationIds: string[]
}

// Lets a guest see their own registered group (and which registration ids belong to them) on
// revisit within the same browser. MVP guest flow has no PIN — the group-management UI is gated
// behind this record existing at all, so per-click identity re-verification isn't needed on top.
function guestStorageKey(activityId: string) {
  return `whonext:guest-registration:${activityId}`
}

function readGuestRecord(activityId: string): GuestRegistrationRecord | null {
  if (import.meta.server) return null
  const raw = localStorage.getItem(guestStorageKey(activityId))
  return raw ? (JSON.parse(raw) as GuestRegistrationRecord) : null
}

function writeGuestRecord(activityId: string, record: GuestRegistrationRecord) {
  if (import.meta.server) return
  localStorage.setItem(guestStorageKey(activityId), JSON.stringify(record))
}

function clearGuestRecord(activityId: string) {
  if (import.meta.server) return
  localStorage.removeItem(guestStorageKey(activityId))
}

// Re-derives registrationIds from whichever of the group's members the server still has —
// cancelling the isPrimary member cascades server-side to the whole group, so this can drop
// more than the one id that was actually clicked. Clears the record once nobody is left.
function syncGuestRecord(activityId: string, groupId: string, currentIds: string[]) {
  if (import.meta.server) return
  if (currentIds.length) writeGuestRecord(activityId, { groupId, registrationIds: currentIds })
  else clearGuestRecord(activityId)
}

function allGuestRegistrationIds(): string[] {
  if (import.meta.server) return []
  const ids: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith('whonext:guest-registration:')) continue
    const raw = localStorage.getItem(key)
    if (!raw) continue
    const record = JSON.parse(raw) as GuestRegistrationRecord
    ids.push(...record.registrationIds)
  }
  return ids
}

export function useRegistrations() {
  const service = resolveRegistrationService()

  function listByActivity(activityId: string): Registration[] {
    return service.listByActivity(activityId)
  }

  function myRegistration(activityId: string): Registration | null {
    const regs = listByActivity(activityId)
    const { profile } = useAuth()
    if (profile.value) {
      const mine = regs.find((r) => r.kind === 'line' && r.profileId === profile.value!.id)
      if (mine) return mine
    }
    const guestRecord = readGuestRecord(activityId)
    if (guestRecord) {
      const mine = regs.find((r) => guestRecord.registrationIds.includes(r.id))
      if (mine) return mine
    }
    return null
  }

  // The full 訪客報名 group this device registered for this activity (主報名者 + 友人), in whatever
  // state the server currently has it — shrinks as members cancel, grows via addGuestCompanion.
  function myGuestGroup(activityId: string): Registration[] {
    const record = readGuestRecord(activityId)
    if (!record) return []
    return listByActivity(activityId).filter((r) => r.groupId === record.groupId)
  }

  async function registerWithLine(activityId: string) {
    const { profile } = useAuth()
    if (!profile.value) throw new Error('必須先登入 LINE 帳號')
    return service.registerWithLine(activityId, profile.value.id)
  }

  async function registerAsGuest(payload: GuestRegisterPayload) {
    const registrations = await service.registerAsGuest(payload)
    writeGuestRecord(payload.activityId, {
      groupId: registrations[0].groupId,
      registrationIds: registrations.map((r) => r.id)
    })
    return registrations
  }

  // 補充報名 — tops up an existing group with one more member (max 4 total, never primary).
  async function addGuestCompanion(activityId: string, groupId: string, nickname: string) {
    const registration = await service.addGuestCompanion(groupId, nickname)
    const record = readGuestRecord(activityId)
    if (record) writeGuestRecord(activityId, { ...record, registrationIds: [...record.registrationIds, registration.id] })
    return registration
  }

  async function setAvatar(registrationId: string, avatarUrl: string) {
    await service.setAvatar(registrationId, avatarUrl)
  }

  async function cancel(activityId: string, registrationId: string, nickname?: string) {
    const record = readGuestRecord(activityId)
    await service.cancel(registrationId, nickname)
    if (record) {
      const stillThere = listByActivity(activityId)
        .filter((r) => r.groupId === record.groupId)
        .map((r) => r.id)
      syncGuestRecord(activityId, record.groupId, stillThere)
    }
  }

  async function setCheckedIn(registrationId: string, checkedIn: boolean) {
    await service.setCheckedIn(registrationId, checkedIn)
  }

  // All of the current viewer's registrations across every activity — LINE ones via profile id,
  // guest ones via the per-activity localStorage records left by registerAsGuest. Used to list
  // redemption cards (核銷卡) without requiring the caller to already know which activities to check.
  async function myRegistrations(): Promise<Registration[]> {
    const { profile } = useAuth()
    return service.listMine(profile.value?.id ?? null, allGuestRegistrationIds())
  }

  return {
    listByActivity,
    myRegistration,
    myGuestGroup,
    myRegistrations,
    registerWithLine,
    registerAsGuest,
    addGuestCompanion,
    setAvatar,
    cancel,
    setCheckedIn
  }
}
