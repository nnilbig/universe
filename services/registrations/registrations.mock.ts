import type { RegistrationService } from './registrations.types'
import type { Registration } from '~/types'
import {
  registrationsTable,
  listRegistrationsByActivity,
  insertRegistrations,
  removeRegistrationGroup,
  updateRegistrationAvatar,
  updateRegistrationCheckedIn,
  generateId
} from '~/mocks/seed'

const MOCK_LATENCY_MS = 250

function delay(ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// mock only — a real implementation must use a proper password-hashing algorithm (e.g. bcrypt) server-side.
function hashPin(pin: string): string {
  return `m${Array.from(pin)
    .map((c) => c.charCodeAt(0))
    .join('-')}`
}

export const registrationsServiceMock: RegistrationService = {
  listByActivity(activityId) {
    return listRegistrationsByActivity(activityId)
  },
  async registerWithLine(activityId, profileId) {
    await delay()
    const existing = listRegistrationsByActivity(activityId).find(
      (r) => r.kind === 'line' && r.profileId === profileId
    )
    if (existing) return existing

    const registration: Registration = {
      id: generateId('reg'),
      activityId,
      kind: 'line',
      groupId: generateId('grp'),
      profileId,
      checkedIn: false,
      createdAt: new Date().toISOString()
    }
    insertRegistrations([registration])
    return registration
  },
  async registerAsGuest(payload) {
    await delay()
    const groupId = generateId('grp')
    const pinHash = hashPin(payload.pin)
    const registrations: Registration[] = payload.members.map((member) => ({
      id: generateId('reg'),
      activityId: payload.activityId,
      kind: 'guest',
      groupId,
      nickname: member.nickname,
      pinHash,
      checkedIn: false,
      createdAt: new Date().toISOString()
    }))
    insertRegistrations(registrations)
    return registrations
  },
  async setAvatar(registrationId, avatarUrl) {
    await delay(100)
    updateRegistrationAvatar(registrationId, avatarUrl)
  },
  async cancel(registrationId, pin) {
    await delay()
    const registration = registrationsTable.find((r) => r.id === registrationId)
    if (!registration) return

    if (registration.kind === 'guest') {
      if (!pin || hashPin(pin) !== registration.pinHash) {
        throw new Error('PIN 不正確')
      }
    }
    removeRegistrationGroup(registration.groupId)
  },
  async setCheckedIn(registrationId, checkedIn) {
    await delay(150)
    updateRegistrationCheckedIn(registrationId, checkedIn)
  },
  async listMine(profileId, guestRegistrationIds) {
    await delay(100)
    const guestIds = new Set(guestRegistrationIds)
    return registrationsTable.filter(
      (r) => (r.kind === 'line' && r.profileId === profileId) || (r.kind === 'guest' && guestIds.has(r.id))
    )
  }
}
