/** Today's date in the person's own time zone, as YYYY-MM-DD. */
export function localDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function timeAgo(iso: string): string {
  const then = new Date(iso)
  const mins = Math.round((Date.now() - then.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  if (then.toDateString() === new Date().toDateString()) {
    return then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return then.toLocaleDateString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
}

export function weekdayName(d = new Date()): string {
  return d.toLocaleDateString([], { weekday: 'long' })
}

/** Parse YYYY-MM-DD as a local calendar date (no time zone shift). */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return localDate(d)
}

/** Monday of the week that contains this date. */
export function weekStart(s: string): string {
  const d = parseDate(s)
  const dow = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - dow)
  return localDate(d)
}

export function shortDate(s: string): string {
  return parseDate(s).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000)
}
