import type { ActivityService, ActivityWithLookups } from './activities.types'
import { activitiesTable, activityTypesTable, sportTypesTable, findActivityById, insertActivity, generateId } from '~/mocks/seed'

const MOCK_LATENCY_MS = 200

function delay(ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function withLookups(activity: (typeof activitiesTable)[number]): ActivityWithLookups {
  const activityType = activityTypesTable.find((t) => t.id === activity.activityTypeId)
  const sportType = sportTypesTable.find((s) => s.id === activity.sportTypeId)
  if (!activityType || !sportType) throw new Error(`missing lookup for activity ${activity.id}`)
  return { ...activity, activityType, sportType }
}

function daysFromToday(dateIso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateIso}T00:00:00`)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function bySportType(list: ActivityWithLookups[], sportTypeCode?: string) {
  if (!sportTypeCode || sportTypeCode === 'all') return list
  return list.filter((a) => a.sportType.code === sportTypeCode)
}

export const activitiesServiceMock: ActivityService = {
  async listTypes() {
    return {
      activityTypes: [...activityTypesTable].sort((a, b) => a.sortOrder - b.sortOrder),
      sportTypes: [...sportTypesTable].sort((a, b) => a.sortOrder - b.sortOrder)
    }
  },
  async getWeekly(sportTypeCode) {
    await delay()
    const list = activitiesTable
      .map(withLookups)
      .filter((a) => {
        const offset = daysFromToday(a.date)
        return offset >= 0 && offset <= 6
      })
      .sort((a, b) => a.date.localeCompare(b.date))
    return bySportType(list, sportTypeCode)
  },
  async getMonthly(sportTypeCode) {
    await delay()
    const list = activitiesTable
      .map(withLookups)
      .filter((a) => {
        const offset = daysFromToday(a.date)
        return offset > 6 && offset <= 30
      })
      .sort((a, b) => a.date.localeCompare(b.date))
    return bySportType(list, sportTypeCode)
  },
  async getById(id) {
    await delay(100)
    const activity = findActivityById(id)
    return activity ? withLookups(activity) : undefined
  },
  async createActivity(input, organizerId) {
    await delay()
    const activity = {
      id: generateId('activity'),
      title: input.title,
      activityTypeId: input.activityTypeId,
      sportTypeId: input.sportTypeId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      organizerId,
      capacity: input.capacity,
      fee: input.fee,
      status: 'open' as const,
      createdAt: new Date().toISOString()
    }
    insertActivity(activity)
    return withLookups(activity)
  }
}
