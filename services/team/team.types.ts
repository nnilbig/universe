import type { MonthlyDuesEntry } from '~/types'

export interface TeamService {
  listMonthlyDues(): Promise<MonthlyDuesEntry[]>
  addMonthlyDues(name: string, balance: number, createdBy: string): Promise<MonthlyDuesEntry>
  updateMonthlyDuesBalance(id: string, balance: number): Promise<void>
  removeMonthlyDues(id: string): Promise<void>
}
