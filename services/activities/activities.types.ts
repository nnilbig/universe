import type { Activity, ActivityType, SportType } from '~/types'

export interface ActivityWithLookups extends Activity {
  activityType: ActivityType
  sportType: SportType
}

export interface CreateActivityInput {
  title: string
  activityTypeId: string
  sportTypeId: string
  date: string // ISO date, e.g. '2026-08-22'
  startTime: string // 'HH:mm'
  endTime?: string
  location: string
  capacity: number
  fee: number
}

export interface ActivityService {
  // Async because a live implementation fetches these from Supabase; the mock resolves instantly.
  listTypes(): Promise<{ activityTypes: ActivityType[]; sportTypes: SportType[] }>
  getWeekly(sportTypeCode?: string): Promise<ActivityWithLookups[]>
  getMonthly(sportTypeCode?: string): Promise<ActivityWithLookups[]>
  getById(id: string): Promise<ActivityWithLookups | undefined>
  /** 舉辦活動 — organizerId is the caller's own profile id (RLS requires organizer_id = auth.uid()). */
  createActivity(input: CreateActivityInput, organizerId: string): Promise<ActivityWithLookups>
}
