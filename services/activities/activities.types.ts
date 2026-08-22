import type { Activity, ActivityStatus, ActivityType, SportType } from '~/types'

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

export interface UpdateActivityInput {
  title?: string
  activityTypeId?: string
  sportTypeId?: string
  date?: string
  startTime?: string
  endTime?: string
}

export interface ActivityService {
  // Async because a live implementation fetches these from Supabase; the mock resolves instantly.
  listTypes(): Promise<{ activityTypes: ActivityType[]; sportTypes: SportType[] }>
  getWeekly(sportTypeCode?: string): Promise<ActivityWithLookups[]>
  getUpcoming(sportTypeCode?: string): Promise<ActivityWithLookups[]>
  getById(id: string): Promise<ActivityWithLookups | undefined>
  /** 舉辦活動 — organizerId is the caller's own profile id (RLS requires organizer_id = auth.uid()). */
  createActivity(input: CreateActivityInput, organizerId: string): Promise<ActivityWithLookups>
  /** 關閉活動 — organizer/admin/owner only (RLS-enforced on the live backend). */
  updateStatus(id: string, status: ActivityStatus): Promise<ActivityWithLookups>
  /** 編輯活動時間/標題/標籤 — organizer/admin/owner only (RLS-enforced on the live backend). */
  updateActivity(id: string, patch: UpdateActivityInput): Promise<ActivityWithLookups>
}
