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
