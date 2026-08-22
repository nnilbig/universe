import { storeToRefs } from 'pinia'
import type { ActivityService } from '~/services/activities/activities.types'
import { activitiesServiceMock } from '~/services/activities/activities.mock'
import { activitiesServiceLive } from '~/services/activities/activities.live'

function resolveActivityService(): ActivityService {
  const config = useRuntimeConfig()
  return config.public.authMode === 'live' ? activitiesServiceLive : activitiesServiceMock
}

export function useActivities() {
  const service = resolveActivityService()
  const store = useActivitiesStore()
  const { weekly, upcoming, activityTypes, sportTypes, isLoading } = storeToRefs(store)

  async function loadLookups() {
    const { activityTypes, sportTypes } = await service.listTypes()
    store.setLookups(activityTypes, sportTypes)
  }

  async function loadWeekly(sportTypeCode?: string) {
    store.setWeekly(await service.getWeekly(sportTypeCode))
  }

  async function loadUpcoming(sportTypeCode?: string) {
    store.setUpcoming(await service.getUpcoming(sportTypeCode))
  }

  async function loadFeed(sportTypeCode?: string) {
    store.setLoading(true)
    try {
      await Promise.all([loadLookups(), loadWeekly(sportTypeCode), loadUpcoming(sportTypeCode)])
    } finally {
      store.setLoading(false)
    }
  }

  function getById(id: string) {
    return service.getById(id)
  }

  async function createActivity(input: Parameters<ActivityService['createActivity']>[0], organizerId: string) {
    const activity = await service.createActivity(input, organizerId)
    await Promise.all([loadWeekly(), loadUpcoming()])
    return activity
  }

  async function closeActivity(id: string) {
    const activity = await service.updateStatus(id, 'closed')
    await Promise.all([loadWeekly(), loadUpcoming()])
    return activity
  }

  return {
    weekly,
    upcoming,
    activityTypes,
    sportTypes,
    isLoading,
    loadLookups,
    loadWeekly,
    loadUpcoming,
    loadFeed,
    getById,
    createActivity,
    closeActivity
  }
}
