import { heatLevel } from '@lernling/core'
import { addDays, localDay } from '../lib/dates'
import type { DayStat } from '../lib/hooks'

/** Single row of the last n days, for roster rows. The full map is StreakMap. */
export function StripHeatmap({ days, n = 30 }: { days: Map<string, DayStat>; n?: number }) {
  const end = new Date()
  const cells = Array.from({ length: n }, (_, i) => localDay(addDays(end, i - (n - 1))))
  return (
    <div className="heat-strip">
      {cells.map((day) => {
        const s = days.get(day)
        return (
          <span key={day} className={`cell l${heatLevel(s)}`} title={`${day}: ${s ? `${s.minutes} min` : 'no study'}`} />
        )
      })}
    </div>
  )
}
