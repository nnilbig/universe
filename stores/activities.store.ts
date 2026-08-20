import { defineStore } from 'pinia'
import type { ActivityType, SportType } from '~/types'
import type { ActivityWithLookups } from '~/services/activities/activities.types'

export const useActivitiesStore = defineStore('activities', {
  state: () => ({
    weekly: [] as ActivityWithLookups[],
    upcoming: [] as ActivityWithLookups[],
    activityTypes: [] as ActivityType[],
    sportTypes: [] as SportType[],
    isLoading: false
  }),
  actions: {
    setLookups(activityTypes: ActivityType[], sportTypes: SportType[]) {
      this.activityTypes = activityTypes
      this.sportTypes = sportTypes
    },
    setWeekly(list: ActivityWithLookups[]) {
      this.weekly = list
    },
    setUpcoming(list: ActivityWithLookups[]) {
      this.upcoming = list
    },
    setLoading(loading: boolean) {
      this.isLoading = loading
    }
  }
})
