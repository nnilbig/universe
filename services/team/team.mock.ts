import type { TeamService } from './team.types'
import { monthlyDuesTable, generateId } from '~/mocks/seed'

const MOCK_LATENCY_MS = 250
function delay(ms = MOCK_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const teamServiceMock: TeamService = {
  async listMonthlyDues() {
    await delay()
    return [...monthlyDuesTable].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
  async addMonthlyDues(name, balance) {
    await delay()
    const entry = { id: generateId('due'), name, balance, createdAt: new Date().toISOString() }
    monthlyDuesTable.push(entry)
    return entry
  },
  async updateMonthlyDuesBalance(id, balance) {
    await delay(100)
    const entry = monthlyDuesTable.find((e) => e.id === id)
    if (entry) entry.balance = balance
  },
  async removeMonthlyDues(id) {
    await delay()
    const idx = monthlyDuesTable.findIndex((e) => e.id === id)
    if (idx !== -1) monthlyDuesTable.splice(idx, 1)
  }
}
