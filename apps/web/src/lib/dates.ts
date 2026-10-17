/** YYYY-MM-DD in the browser's timezone (the extension sets the profile timezone to match). */
export const localDay = (d: Date = new Date()): string => d.toLocaleDateString('en-CA')

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** The last n days as YYYY-MM-DD, oldest first, ending today. */
export function lastNDays(n: number): string[] {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => localDay(addDays(today, i - (n - 1))))
}

/** 95 -> "1h 35m", 40 -> "40 min". */
export function fmtMinutes(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/** Longest run of consecutive studied days between two YYYY-MM-DD dates (inclusive). */
export function longestRun(days: Map<string, { studied: boolean }>, from: string, to: string): number {
  let best = 0
  let run = 0
  for (let d = new Date(from + 'T00:00:00'); localDay(d) <= to; d = addDays(d, 1)) {
    if (days.get(localDay(d))?.studied) {
      run++
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

export function shortDate(day: string): string {
  return new Date(day + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
