import type { WalletService } from './wallet.types'
import type { ProfileRole } from '~/types'
import { profilesTable, walletTransactionsTable, generateId } from '~/mocks/seed'

const MOCK_LATENCY_MS = 300
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const ROLE_PRIORITY: Record<ProfileRole, number> = { subscriber: 0, player: 1, admin: 2, owner: 3 }

export const walletServiceMock: WalletService = {
  async listMembers() {
    await delay(MOCK_LATENCY_MS)
    return [...profilesTable].sort((a, b) => {
      const diff = (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99)
      return diff !== 0 ? diff : a.displayName.localeCompare(b.displayName, 'zh-Hant')
    })
  },
  async applyTopUps(entries) {
    await delay(MOCK_LATENCY_MS)
    const now = new Date().toISOString()
    for (const entry of entries) {
      const profile = profilesTable.find((p) => p.id === entry.profileId)
      if (!profile) continue
      profile.walletBalance = Math.max(0, profile.walletBalance + entry.amount)
      walletTransactionsTable.unshift({
        id: generateId('wtx'),
        profileId: entry.profileId,
        amount: entry.amount,
        method: entry.method,
        createdAt: now
      })
    }
  },
  async listTransactions(profileId) {
    await delay(MOCK_LATENCY_MS)
    return walletTransactionsTable
      .filter((t) => t.profileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}
