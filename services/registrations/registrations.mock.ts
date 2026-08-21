import type { RegistrationService } from './registrations.types'
import type { Registration } from '~/types'
import {
  registrationsTable,
  listRegistrationsByActivity,
  insertRegistrations,
  removeRegistration,
  updateRegistrationAvatar,
  updateRegistrationCheckedIn,
  generateId
} from '~/mocks/seed'

const MOCK_LATENCY_MS = 250

function delay(ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
      isPrimary: false,
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
    const registrations: Registration[] = payload.members.map((member, i) => ({
      id: generateId('reg'),
      activityId: payload.activityId,
      kind: 'guest',
      groupId,
      isPrimary: i === 0,
      nickname: member.nickname,
      checkedIn: false,
      createdAt: new Date().toISOString()
    }))
    insertRegistrations(registrations)
    return registrations
  },
  async addGuestCompanion(groupId, nickname) {
    await delay()
    const groupmate = registrationsTable.find((r) => r.groupId === groupId)
    if (!groupmate) throw new Error('找不到該報名團')
    if (registrationsTable.filter((r) => r.groupId === groupId).length >= 4) {
      throw new Error('此團已達 4 人上限')
    }
    const registration: Registration = {
      id: generateId('reg'),
      activityId: groupmate.activityId,
      kind: 'guest',
      groupId,
      isPrimary: false,
      nickname,
      checkedIn: false,
      createdAt: new Date().toISOString()
    }
    insertRegistrations([registration])
    return registration
  },
  async setAvatar(registrationId, avatarUrl) {
    await delay(100)
    updateRegistrationAvatar(registrationId, avatarUrl)
  },
  async cancel(registrationId, nickname) {
    await delay()
    const registration = registrationsTable.find((r) => r.id === registrationId)
    if (!registration) return

    if (registration.kind === 'guest' && registration.nickname !== nickname) {
      throw new Error('暱稱不符')
    }
    removeRegistration(registrationId)
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
