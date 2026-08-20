import type { Profile, WalletTopUpEntry } from '~/types'

export interface WalletService {
  /** All member profiles for the admin top-up screen — subscribers first, then regular players. */
  listMembers(): Promise<Profile[]>
  /** Applies every entry's amount to its profile's wallet_balance and records the top-up method. */
  applyTopUps(entries: WalletTopUpEntry[]): Promise<void>
}
