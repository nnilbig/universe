import type { WalletService } from './wallet.types'
import type { ProfileRole } from '~/types'
import { profilesTable } from '~/mocks/seed'

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
    for (const entry of entries) {
      const profile = profilesTable.find((p) => p.id === entry.profileId)
      if (profile) profile.walletBalance = Math.max(0, profile.walletBalance + entry.amount)
    }
  }
}
