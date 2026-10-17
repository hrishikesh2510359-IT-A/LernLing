import { useEffect, useMemo, useRef, useState } from 'react'
import { heatLevel } from '@lernling/core'
import { addDays, fmtMinutes, localDay, longestRun } from '../lib/dates'
import { useAsync, type DayStat } from '../lib/hooks'
import { must } from '../lib/query'
import { supabase } from '../lib/supabase'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface MonthBlock {
  key: string
  label: string
  cols: (string | null)[][]
}

/** Builds month blocks of week-columns (Sunday on top), blank-padded at the edges, like LeetCode. */
function buildMonths(start: Date, end: Date): MonthBlock[] {
  const blocks: MonthBlock[] = []
  let cur = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cur <= end) {
    const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
    const first = cur > start ? cur : start
    const last = monthEnd < end ? monthEnd : end
    const cols: (string | null)[][] = []
    let col: (string | null)[] = Array(first.getDay()).fill(null)
    for (let d = new Date(first); d <= last; d = addDays(d, 1)) {
      col.push(localDay(d))
      if (col.length === 7) {
        cols.push(col)
        col = []
      }
    }
    if (col.length) {
      while (col.length < 7) col.push(null)
      cols.push(col)
    }
    blocks.push({ key: `${cur.getFullYear()}-${cur.getMonth()}`, label: MONTHS[cur.getMonth()]!, cols })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }
  return blocks
}

/** LeetCode-style activity map with totals, max streak and a year picker. */
export function StreakMap({ days }: { days: Map<string, DayStat> }) {
  const [range, setRange] = useState<'current' | number>('current')
  const scroller = useRef<HTMLDivElement>(null)

  const years = useMemo(() => {
    const ys = new Set<number>([new Date().getFullYear()])
    for (const k of days.keys()) ys.add(Number(k.slice(0, 4)))
    return [...ys].sort((a, b) => b - a)
  }, [days])

  const { start, end } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (range === 'current') return { start: addDays(today, -364), end: today }
    const yEnd = new Date(range, 11, 31)
    return { start: new Date(range, 0, 1), end: yEnd < today ? yEnd : today }
  }, [range])

  const months = useMemo(() => buildMonths(start, end), [start, end])

  const stats = useMemo(() => {
    const from = localDay(start)
    const to = localDay(end)
    let minutes = 0
    let active = 0
    for (const [day, s] of days) {
      if (day < from || day > to) continue
      minutes += s.minutes
      if (s.studied) active++
    }
    return { minutes, active, maxStreak: longestRun(days, from, to) }
  }, [days, start, end])

  // Start scrolled to today (right edge) on narrow screens.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [months])

  const label = range === 'current' ? 'the past year' : String(range)

  return (
    <div className="smap-wrap">
      <div className="row smap-head">
        <div className="grow">
          <span className="smap-total">{fmtMinutes(stats.minutes)}</span>{' '}
          <span className="muted">studied in {label}</span>
        </div>
        <span className="muted">Total active days: <b>{stats.active}</b></span>
        <span className="muted">Max streak: <b>{stats.maxStreak}</b></span>
        <select
          aria-label="Year"
          value={String(range)}
          onChange={(e) => setRange(e.target.value === 'current' ? 'current' : Number(e.target.value))}
        >
          <option value="current">Current</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="smap-scroll" ref={scroller}>
        <div className="smap">
          {months.map((m) => (
            <div className="smap-month" key={m.key}>
              <div className="smap-grid" style={{ gridTemplateColumns: `repeat(${m.cols.length}, 13px)` }}>
                {m.cols.flat().map((day, i) => {
                  if (!day) return <span key={i} className="cell blank" />
                  const s = days.get(day)
                  return (
                    <span
                      key={day}
                      className={`cell l${heatLevel(s)}`}
                      title={`${day}: ${s ? `${s.minutes} min${s.lessons ? `, ${s.lessons} lesson${s.lessons === 1 ? '' : 's'}` : ''}` : 'no study'}`}
                    />
                  )
                })}
              </div>
              <div className="smap-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="legend" style={{ marginTop: 8 }}>
        Less {[0, 1, 2, 3, 4, 5].map((l) => <i key={l} className={`cell l${l}`} style={{ width: 12, height: 12 }} />)} More
      </div>
    </div>
  )
}

/** Loads one person's daily summaries and shows their map. Group mates can read these (RLS). */
export function MemberMap({ userId }: { userId: string }) {
  const { data, loading, error } = useAsync(async () => {
    const since = localDay(addDays(new Date(), -730))
    const rows = must(
      await supabase
        .from('daily_summary')
        .select('day, active_minutes, lessons_done, studied')
        .eq('user_id', userId)
        .gte('day', since),
    )
    const m = new Map<string, DayStat>()
    for (const r of rows) {
      m.set(r.day as string, { minutes: r.active_minutes, lessons: r.lessons_done, studied: r.studied })
    }
    return m
  }, [userId])

  if (loading) return <div className="spinner">Loading map…</div>
  if (error || !data) return <p className="error">{error}</p>
  return <StreakMap days={data} />
}
