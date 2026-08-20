export type TopUpMethod = 'linepay' | 'cash'

export interface WalletTopUpEntry {
  profileId: string
  amount: number
  method: TopUpMethod
}
