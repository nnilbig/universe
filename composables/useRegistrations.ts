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

// Re-derives registrationIds from whichever of the group's members the server still has.
// Clears the record once nobody is left.
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

  // The full registration group for this activity that the viewer belongs to — whether they
  // anchored it themselves (LINE registration or 訪客報名 主報名者) or it's a 補充報名 companion
  // group — in whatever state the server currently has it. Shrinks as members cancel, grows via
  // addGuestCompanion. A LINE member is found via their profile id; a guest via the per-activity
  // localStorage record left by registerAsGuest.
  function myRegistrationGroup(activityId: string): Registration[] {
    const regs = listByActivity(activityId)
    const { profile } = useAuth()
    if (profile.value) {
      const mine = regs.find((r) => r.kind === 'line' && r.profileId === profile.value!.id)
      if (mine) return regs.filter((r) => r.groupId === mine.groupId)
    }
    const guestRecord = readGuestRecord(activityId)
    if (guestRecord) return regs.filter((r) => r.groupId === guestRecord.groupId)
    return []
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

  // 管理員手動新增報名人員 — unlike registerAsGuest, doesn't write a device-local guest record,
  // since the admin adding someone isn't that guest themselves (RLS: "admins and owners create
  // any registration", see supabase/migrations/20260820000000_role_permissions.sql).
  async function adminAddGuest(activityId: string, nickname: string) {
    const [registration] = await service.registerAsGuest({ activityId, members: [{ nickname }] })
    return registration
  }

  // 補充報名 — tops up an existing group with one more member (never primary).
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
  // redemption cards (入場通行證) without requiring the caller to already know which activities to check.
  async function myRegistrations(): Promise<Registration[]> {
    const { profile } = useAuth()
    return service.listMine(profile.value?.id ?? null, allGuestRegistrationIds())
  }

  return {
    listByActivity,
    myRegistrationGroup,
    myRegistrations,
    registerWithLine,
    registerAsGuest,
    adminAddGuest,
    addGuestCompanion,
    setAvatar,
    cancel,
    setCheckedIn
  }
}
