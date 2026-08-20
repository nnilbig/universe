import type { ActivityService, ActivityWithLookups, CreateActivityInput } from './activities.types'
import type { Activity, ActivityType, SportType } from '~/types'
import { getSupabaseClient } from '~/lib/supabase'

// Backing tables (camelCase mapping matches types/activity.ts):
//   activity_types(id, code, label_zh, sort_order)
//   sport_types(id, code, icon_key, label_zh, sort_order)
//   activities(id, title, activity_type_id, sport_type_id, date, start_time, end_time, location,
//              organizer_id, capacity, fee, status, poster_url, created_at)
// activity_types/sport_types are near-static reference data, so they're fetched once and cached
// for the lifetime of the app rather than re-queried on every listTypes()/getWeekly() call.

interface ActivityTypeRow {
  id: string
  code: ActivityType['code']
  label_zh: string
  sort_order: number
}
interface SportTypeRow {
  id: string
  code: SportType['code']
  icon_key: string
  label_zh: string
  sort_order: number
}
interface ActivityRow {
  id: string
  title: string
  activity_type_id: string
  sport_type_id: string
  date: string
  start_time: string
  end_time: string | null
  location: string
  organizer_id: string
  capacity: number
  fee: number
  status: Activity['status']
  poster_url: string | null
  created_at: string
}

function mapActivityType(row: ActivityTypeRow): ActivityType {
  return { id: row.id, code: row.code, labelZh: row.label_zh, sortOrder: row.sort_order }
}
function mapSportType(row: SportTypeRow): SportType {
  return { id: row.id, code: row.code, labelZh: row.label_zh, iconKey: row.icon_key, sortOrder: row.sort_order }
}
function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    title: row.title,
    activityTypeId: row.activity_type_id,
    sportTypeId: row.sport_type_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    location: row.location,
    organizerId: row.organizer_id,
    capacity: row.capacity,
    fee: row.fee,
    status: row.status,
    posterUrl: row.poster_url ?? undefined,
    createdAt: row.created_at
  }
}

type Lookups = { activityTypes: ActivityType[]; sportTypes: SportType[] }

let lookupsCache: Lookups | null = null
let lookupsPromise: Promise<Lookups> | null = null

function loadLookupsOnce(): Promise<Lookups> {
  if (lookupsCache) return Promise.resolve(lookupsCache)
  if (!lookupsPromise) {
    lookupsPromise = (async () => {
      const supabase = getSupabaseClient()
      const [typesRes, sportsRes] = await Promise.all([
        supabase.from('activity_types').select('*').order('sort_order'),
        supabase.from('sport_types').select('*').order('sort_order')
      ])
      if (typesRes.error) throw typesRes.error
      if (sportsRes.error) throw sportsRes.error
      lookupsCache = {
        activityTypes: (typesRes.data as ActivityTypeRow[]).map(mapActivityType),
        sportTypes: (sportsRes.data as SportTypeRow[]).map(mapSportType)
      }
      return lookupsCache
    })()
  }
  return lookupsPromise
}

async function withLookups(row: ActivityRow): Promise<ActivityWithLookups> {
  const { activityTypes, sportTypes } = await loadLookupsOnce()
  const activityType = activityTypes.find((t) => t.id === row.activity_type_id)
  const sportType = sportTypes.find((s) => s.id === row.sport_type_id)
  if (!activityType || !sportType) throw new Error(`missing lookup for activity ${row.id}`)
  return { ...mapActivity(row), activityType, sportType }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// startOffsetDays/endOffsetDays mirror activities.mock.ts's daysFromToday filters: weekly is
// today..+6, monthly is +7..+30.
async function getRange(
  startOffsetDays: number,
  endOffsetDays: number,
  sportTypeCode?: string
): Promise<ActivityWithLookups[]> {
  const { sportTypes } = await loadLookupsOnce()
  const supabase = getSupabaseClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() + startOffsetDays)
  const end = new Date(today)
  end.setDate(end.getDate() + endOffsetDays)

  let query = supabase.from('activities').select('*').gte('date', isoDate(start)).lte('date', isoDate(end))

  if (sportTypeCode && sportTypeCode !== 'all') {
    const sportType = sportTypes.find((s) => s.code === sportTypeCode)
    if (!sportType) return []
    query = query.eq('sport_type_id', sportType.id)
  }

  const { data, error } = await query.order('date', { ascending: true })
  if (error) throw error
  return Promise.all((data as ActivityRow[]).map(withLookups))
}

export const activitiesServiceLive: ActivityService = {
  listTypes() {
    return loadLookupsOnce()
  },
  getWeekly(sportTypeCode) {
    return getRange(0, 6, sportTypeCode)
  },
  getMonthly(sportTypeCode) {
    return getRange(7, 30, sportTypeCode)
  },
  async getById(id) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('activities').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? withLookups(data as ActivityRow) : undefined
  },
  async createActivity(input: CreateActivityInput, organizerId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('activities')
      .insert({
        title: input.title,
        activity_type_id: input.activityTypeId,
        sport_type_id: input.sportTypeId,
        date: input.date,
        start_time: input.startTime,
        end_time: input.endTime ?? null,
        location: input.location,
        organizer_id: organizerId,
        capacity: input.capacity,
        fee: input.fee,
        status: 'open'
      })
      .select('*')
      .single()
    if (error) throw error
    return withLookups(data as ActivityRow)
  }
}
