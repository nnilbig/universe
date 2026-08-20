import { storeToRefs } from 'pinia'

// sessionStorage (not localStorage) so it resets per tab/session but survives reloads and the
// LINE login redirect chain (same tab navigates to LINE and back) — the splash should only replay
// if the user actually opens a fresh tab/session, not on every reload or post-login reload.
const SPLASH_SESSION_KEY = 'whonext:splash-shown'

export function useSplash() {
  const store = useUiStore()
  const { isSplashLoading, splashProgress: progress } = storeToRefs(store)

  // Each step is a real boot task (auth init, lookups, weekly/monthly fetch, ...) — progress
  // advances only when a step actually completes, so it reflects real work, not a fake animation.
  // This also means the same loop naturally reflects real LIFF/Supabase latency once useAuth's
  // live implementation is wired in — no changes needed here.
  async function runBoot(steps: Array<() => Promise<void>>) {
    const alreadyShown = import.meta.client && sessionStorage.getItem(SPLASH_SESSION_KEY) === '1'
    if (alreadyShown) {
      store.setSplashLoading(false)
      for (const step of steps) await step()
      return
    }

    store.setSplashLoading(true)
    store.setSplashProgress(0)

    for (let i = 0; i < steps.length; i++) {
      await steps[i]()
      store.setSplashProgress(Math.round(((i + 1) / steps.length) * 100))
    }

    if (import.meta.client) sessionStorage.setItem(SPLASH_SESSION_KEY, '1')
    setTimeout(() => store.setSplashLoading(false), 200)
  }

  return { isSplashLoading, progress, runBoot }
}
