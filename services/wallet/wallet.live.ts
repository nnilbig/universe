import type { WalletService } from './wallet.types'
import type { ProfileRole } from '~/types'
import { getSupabaseClient } from '~/lib/supabase'
import { mapProfileRow, cacheProfiles, type ProfileRow } from '~/lib/profileCache'

// Backing RPC: adjust_wallet_balance(p_user_id uuid, p_delta integer, p_method text) — admin/owner
// only (enforced server-side), floors the resulting balance at 0, and writes a wallet_transactions
// row. See supabase/migrations/20260820010000_wallet_topups.sql.

const ROLE_PRIORITY: Record<ProfileRole, number> = { subscriber: 0, player: 1, admin: 2, owner: 3 }

interface WalletTransactionRow {
  id: string
  profile_id: string
  amount: number
  method: 'linepay' | 'cash'
  created_at: string
}

export const walletServiceLive: WalletService = {
  async listMembers() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) throw error
    const profiles = ((data ?? []) as ProfileRow[]).map(mapProfileRow)
    cacheProfiles(profiles)
    return profiles.sort((a, b) => {
      const diff = (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99)
      return diff !== 0 ? diff : a.displayName.localeCompare(b.displayName, 'zh-Hant')
    })
  },
  async applyTopUps(entries) {
    const supabase = getSupabaseClient()
    // Sequential, not Promise.all — a failed entry stays attributable to one member instead of an
    // ambiguous batch rejection, and each RPC call is independently atomic on the server side.
    for (const entry of entries) {
      const { error } = await supabase.rpc('adjust_wallet_balance', {
        p_user_id: entry.profileId,
        p_delta: entry.amount,
        p_method: entry.method
      })
      if (error) throw error
    }
  },
  async listTransactions(profileId) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return ((data ?? []) as WalletTransactionRow[]).map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      amount: row.amount,
      method: row.method,
      createdAt: row.created_at
    }))
  }
}
