import type { WalletService } from '~/services/wallet/wallet.types'
import { walletServiceMock } from '~/services/wallet/wallet.mock'
import { walletServiceLive } from '~/services/wallet/wallet.live'

function resolveWalletService(): WalletService {
  const config = useRuntimeConfig()
  return config.public.authMode === 'live' ? walletServiceLive : walletServiceMock
}

export function useWallet() {
  const service = resolveWalletService()
  return {
    listMembers: service.listMembers,
    applyTopUps: service.applyTopUps
  }
}
