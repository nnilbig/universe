const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六']

export function formatActivityDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS_ZH[d.getDay()]})`
}

export function formatTimeRange(start: string, end?: string): string {
  return end ? `${start} - ${end}` : start
}

export function formatTransactionDate(iso: string): string {
  return iso.slice(0, 10)
}

// Deterministic 6-digit code for a guest group's 入場通行證, derived from groupId rather than a
// stored column — the same group always shows the same code so an organizer can cross-check it
// against what the guest shows on their screen.
export function redemptionCode(groupId: string): string {
  let hash = 0
  for (let i = 0; i < groupId.length; i++) {
    hash = (hash * 31 + groupId.charCodeAt(i)) >>> 0
  }
  return String(hash % 1_000_000).padStart(6, '0')
}
