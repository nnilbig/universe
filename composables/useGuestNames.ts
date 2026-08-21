// MVP guest flow has no PIN. This is purely a convenience memory (prefill + duplicate-avoidance),
// not an identity check — the group-management UI is gated behind the per-activity
// whonext:guest-registration record in composables/useRegistrations.ts, not this.
const GUEST_NAMES_KEY = 'guest_registered_names'

function readNames(): string[] {
  if (import.meta.server) return []
  const raw = localStorage.getItem(GUEST_NAMES_KEY)
  return raw ? (JSON.parse(raw) as string[]) : []
}

function writeNames(names: string[]) {
  if (import.meta.server) return
  localStorage.setItem(GUEST_NAMES_KEY, JSON.stringify(names))
}

export function useGuestNames() {
  function remember(name: string) {
    const names = readNames()
    if (!names.includes(name)) {
      names.push(name)
      writeNames(names)
    }
  }

  /** Most recently registered nickname on this device, for pre-filling the register form. */
  function mostRecent(): string {
    const names = readNames()
    return names[names.length - 1] ?? ''
  }

  return { remember, mostRecent }
}
