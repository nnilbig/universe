export type TopUpMethod = 'linepay' | 'cash'

export interface WalletTopUpEntry {
  profileId: string
  amount: number
  method: TopUpMethod
}

export interface WalletTransaction {
  id: string
  profileId: string
  amount: number
  method: TopUpMethod
  createdAt: string
}
