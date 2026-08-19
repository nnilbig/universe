import { storeToRefs } from 'pinia'

export function useSplash() {
  const store = useUiStore()
  const { isSplashLoading, splashProgress: progress } = storeToRefs(store)

  // Each step is a real boot task (auth init, lookups, weekly/monthly fetch, ...) — progress
  // advances only when a step actually completes, so it reflects real work, not a fake animation.
  // This also means the same loop naturally reflects real LIFF/Supabase latency once useAuth's
  // live implementation is wired in — no changes needed here.
  async function runBoot(steps: Array<() => Promise<void>>) {
    store.setSplashLoading(true)
    store.setSplashProgress(0)

    for (let i = 0; i < steps.length; i++) {
      await steps[i]()
      store.setSplashProgress(Math.round(((i + 1) / steps.length) * 100))
    }

    setTimeout(() => store.setSplashLoading(false), 200)
  }

  return { isSplashLoading, progress, runBoot }
}
