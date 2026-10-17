import { shortDate } from '../lib/dates'

export function Ring({ value, max, label }: { value: number; max: number; label: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  const pct = Math.min(1, max > 0 ? value / max : 0)
  return (
    <svg viewBox="0 0 140 140" className="ring" role="img" aria-label={`${value} of ${max} minutes`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--cream)" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={r} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 70 70)"
      />
      <text x="70" y="68" textAnchor="middle" fontSize="30" fontWeight="800" fill="var(--text)">{value}</text>
      <text x="70" y="88" textAnchor="middle" fontSize="12" fill="var(--muted)">{label}</text>
    </svg>
  )
}

export interface Bar {
  day: string
  a: number // watched video minutes (or total if no split)
  b: number // other active minutes
}

/** Stacked daily bars with a goal line. */
export function BarChart({ bars, goal, aLabel, bLabel }: { bars: Bar[]; goal: number; aLabel: string; bLabel?: string }) {
  const W = 600
  const H = 190
  const pad = { l: 30, r: 8, t: 10, b: 22 }
  const max = Math.max(goal * 1.5, ...bars.map((x) => x.a + x.b), 10)
  const bw = (W - pad.l - pad.r) / bars.length
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="barchart" role="img" aria-label="Daily study minutes">
        <line x1={pad.l} x2={W - pad.r} y1={y(goal)} y2={y(goal)} stroke="var(--green)" strokeDasharray="4 4" />
        <text x={pad.l - 4} y={y(goal) + 4} textAnchor="end" fontSize="10" fill="var(--green)">{goal}</text>
        <text x={pad.l - 4} y={y(0) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">0</text>
        {bars.map((x, i) => {
          const bx = pad.l + i * bw + bw * 0.15
          const w = bw * 0.7
          return (
            <g key={x.day}>
              <title>{`${shortDate(x.day)}: ${x.a + x.b} min`}</title>
              <rect x={bx} y={y(x.a)} width={w} height={y(0) - y(x.a)} fill="var(--primary-dark)" rx="2" />
              <rect x={bx} y={y(x.a + x.b)} width={w} height={y(x.a) - y(x.a + x.b)} fill="#fdba74" rx="2" />
            </g>
          )
        })}
        <text x={pad.l} y={H - 4} fontSize="10" fill="var(--muted)">{bars[0] ? shortDate(bars[0].day) : ''}</text>
        <text x={W - pad.r} y={H - 4} textAnchor="end" fontSize="10" fill="var(--muted)">Today</text>
      </svg>
      <div className="legend">
        <span><i style={{ background: 'var(--primary-dark)' }} /> {aLabel}</span>
        {bLabel && <span><i style={{ background: '#fdba74' }} /> {bLabel}</span>}
        <span><i style={{ background: 'var(--green)' }} /> Daily goal</span>
      </div>
    </div>
  )
}
