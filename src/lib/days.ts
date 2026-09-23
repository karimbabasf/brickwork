const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(t: number): string {
  const d = new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parts(key: string): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number)
  return [y, m - 1, d]
}

export function dayStart(key: string): number {
  const [y, m, d] = parts(key)
  return new Date(y, m, d).getTime()
}

export function nextDayStart(key: string): number {
  const [y, m, d] = parts(key)
  return new Date(y, m, d + 1).getTime()
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = parts(key)
  return dayKey(new Date(y, m, d + n).getTime())
}

/** Whole days from a to b, safe across daylight saving changes. */
export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = parts(a)
  const [y2, m2, d2] = parts(b)
  return Math.round((Date.UTC(y2, m2, d2) - Date.UTC(y1, m1, d1)) / 86_400_000)
}

const longFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short' })
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

export const formatDayLong = (key: string) => longFmt.format(dayStart(key))
export const formatDayShort = (key: string) => shortFmt.format(dayStart(key))
export const formatMonth = (key: string) => monthFmt.format(dayStart(key))
export const formatTime = (t: number) => timeFmt.format(t)
export const dayOfMonth = (key: string) => parts(key)[2]
