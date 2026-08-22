import type { TeamService } from './team.types'
import { getSupabaseClient } from '~/lib/supabase'

// Backing table: monthly_dues(id, name, balance, created_by, created_at). Admin/owner-only both
// ways via RLS — see supabase/migrations/20260822040000_monthly_dues.sql.
interface MonthlyDuesRow {
  id: string
  name: string
  balance: number
  created_at: string
}

export const teamServiceLive: TeamService = {
  async listMonthlyDues() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('monthly_dues').select('*').order('created_at', { ascending: true })
    if (error) throw error
    return (data as MonthlyDuesRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      balance: row.balance,
      createdAt: row.created_at
    }))
  },
  async addMonthlyDues(name, balance, createdBy) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('monthly_dues')
      .insert({ name, balance, created_by: createdBy })
      .select('*')
      .single()
    if (error) throw error
    const row = data as MonthlyDuesRow
    return { id: row.id, name: row.name, balance: row.balance, createdAt: row.created_at }
  },
  async updateMonthlyDuesBalance(id, balance) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('monthly_dues').update({ balance }).eq('id', id)
    if (error) throw error
  },
  async removeMonthlyDues(id) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('monthly_dues').delete().eq('id', id)
    if (error) throw error
  }
}
