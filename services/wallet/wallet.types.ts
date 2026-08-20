import type { Profile, WalletTopUpEntry, WalletTransaction } from '~/types'

export interface WalletService {
  /** All member profiles for the admin top-up screen — subscribers first, then regular players. */
  listMembers(): Promise<Profile[]>
  /** Applies every entry's amount to its profile's wallet_balance and records the top-up method. */
  applyTopUps(entries: WalletTopUpEntry[]): Promise<void>
  /** A profile's wallet ledger, newest first — positive amounts are top-ups, negative are deductions. */
  listTransactions(profileId: string): Promise<WalletTransaction[]>
}
