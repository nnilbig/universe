import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    selectedSportTypeCode: 'all' as string,
    expandedActivityId: null as string | null,
    isSplashLoading: true,
    splashProgress: 0
  }),
  actions: {
    setSportTypeFilter(code: string) {
      this.selectedSportTypeCode = code
    },
    expandActivity(id: string) {
      this.expandedActivityId = id
    },
    closeActivitySheet() {
      this.expandedActivityId = null
    },
    setSplashLoading(loading: boolean) {
      this.isSplashLoading = loading
    },
    setSplashProgress(progress: number) {
      this.splashProgress = progress
    }
  }
})
