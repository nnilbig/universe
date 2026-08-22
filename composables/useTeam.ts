import type { TeamService } from '~/services/team/team.types'
import { teamServiceMock } from '~/services/team/team.mock'
import { teamServiceLive } from '~/services/team/team.live'

function resolveTeamService(): TeamService {
  const config = useRuntimeConfig()
  return config.public.authMode === 'live' ? teamServiceLive : teamServiceMock
}

export function useTeam() {
  const service = resolveTeamService()

  async function addMonthlyDues(name: string, balance: number) {
    const { profile } = useAuth()
    if (!profile.value) throw new Error('必須先登入')
    return service.addMonthlyDues(name, balance, profile.value.id)
  }

  return {
    listMonthlyDues: service.listMonthlyDues,
    addMonthlyDues,
    updateMonthlyDuesBalance: service.updateMonthlyDuesBalance,
    removeMonthlyDues: service.removeMonthlyDues
  }
}
