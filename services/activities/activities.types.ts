import type { Activity, ActivityType, SportType } from '~/types'

export interface ActivityWithLookups extends Activity {
  activityType: ActivityType
  sportType: SportType
}

export interface ActivityService {
  // Async because a live implementation fetches these from Supabase; the mock resolves instantly.
  listTypes(): Promise<{ activityTypes: ActivityType[]; sportTypes: SportType[] }>
  getWeekly(sportTypeCode?: string): Promise<ActivityWithLookups[]>
  getMonthly(sportTypeCode?: string): Promise<ActivityWithLookups[]>
  getById(id: string): Promise<ActivityWithLookups | undefined>
}
