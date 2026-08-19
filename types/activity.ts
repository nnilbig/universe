export interface ActivityType {
  id: string
  code: 'competition' | 'casual' | 'project'
  labelZh: string
  sortOrder: number
}

export interface SportType {
  id: string
  code: 'badminton' | 'volleyball' | 'running' | 'pickleball'
  labelZh: string
  iconKey: string
  sortOrder: number
}

export type ActivityStatus = 'open' | 'full' | 'closed' | 'cancelled'

export interface Activity {
  id: string
  title: string
  activityTypeId: string
  sportTypeId: string
  date: string // ISO date, e.g. '2026-08-22'
  startTime: string // 'HH:mm'
  endTime?: string
  location: string
  organizerId: string
  capacity: number
  status: ActivityStatus
  posterUrl?: string
  createdAt: string
}
