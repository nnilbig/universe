import { reactive } from 'vue'
import { nanoid } from 'nanoid'
import type { Activity, ActivityType, SportType, Registration, Profile, WalletTransaction } from '~/types'
import activityTypesFixture from './fixtures/activity-types.json'
import sportTypesFixture from './fixtures/sport-types.json'
import activitiesFixture from './fixtures/activities.json'
import registrationsFixture from './fixtures/registrations.json'
import profilesFixture from './fixtures/profiles.json'

interface ActivityFixture extends Omit<Activity, 'date' | 'createdAt'> {
  dayOffset: number
}

function toIsoDate(dayOffset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  return d.toISOString().slice(0, 10)
}

// Fixture dates are day-offsets from "today" so 本週/本月 filters always have data to show,
// regardless of when this mock is run.
const seededActivities: Activity[] = (activitiesFixture as ActivityFixture[]).map((a) => ({
  ...a,
  date: toIsoDate(a.dayOffset),
  createdAt: new Date().toISOString()
}))

export const activityTypesTable = reactive<ActivityType[]>([...(activityTypesFixture as ActivityType[])])
export const sportTypesTable = reactive<SportType[]>([...(sportTypesFixture as SportType[])])
export const activitiesTable = reactive<Activity[]>(seededActivities)
export const profilesTable = reactive<Profile[]>([...(profilesFixture as Profile[])])
export const registrationsTable = reactive<Registration[]>([...(registrationsFixture as Registration[])])
// mirrors wallet_transactions — mock's applyTopUps() pushes here so the wallet page's 儲值紀錄 has
// something real (session-local) to read instead of hardcoded fixture rows.
export const walletTransactionsTable = reactive<WalletTransaction[]>([])

export function findActivityById(id: string): Activity | undefined {
  return activitiesTable.find((a) => a.id === id)
}

export function insertActivity(activity: Activity): void {
  activitiesTable.push(activity)
}

export function updateActivityStatus(activityId: string, status: Activity['status']): void {
  const activity = activitiesTable.find((a) => a.id === activityId)
  if (activity) activity.status = status
}

export function updateActivityFields(activityId: string, patch: Partial<Activity>): void {
  const activity = activitiesTable.find((a) => a.id === activityId)
  if (activity) Object.assign(activity, patch)
}

export function listRegistrationsByActivity(activityId: string): Registration[] {
  return registrationsTable.filter((r) => r.activityId === activityId)
}

// 管理員/發起人拖曳排序 — reorders this activity's slice of the table to match orderedIds;
// listRegistrationsByActivity's filter then reflects the new order since it's array order.
export function reorderRegistrations(activityId: string, orderedIds: string[]): void {
  const mine = orderedIds
    .map((id) => registrationsTable.find((r) => r.id === id && r.activityId === activityId))
    .filter((r): r is Registration => !!r)
  const others = registrationsTable.filter((r) => r.activityId !== activityId)
  registrationsTable.splice(0, registrationsTable.length, ...others, ...mine)
}

export function findProfileById(id: string): Profile | undefined {
  return profilesTable.find((p) => p.id === id)
}

export function insertRegistrations(regs: Registration[]): void {
  registrationsTable.push(...regs)
}

export function removeRegistration(registrationId: string): void {
  const idx = registrationsTable.findIndex((r) => r.id === registrationId)
  if (idx !== -1) registrationsTable.splice(idx, 1)
}

export function updateRegistrationAvatar(registrationId: string, avatarUrl: string): void {
  const reg = registrationsTable.find((r) => r.id === registrationId)
  if (reg) reg.avatarUrl = avatarUrl
}

export function updateRegistrationCheckedIn(registrationId: string, checkedIn: boolean): void {
  const reg = registrationsTable.find((r) => r.id === registrationId)
  if (reg) reg.checkedIn = checkedIn
}

export function generateId(prefix: string): string {
  return `${prefix}-${nanoid(8)}`
}
