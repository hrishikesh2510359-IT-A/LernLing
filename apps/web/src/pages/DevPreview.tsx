import { Flame } from '../components/Flame'
import { StreakMap } from '../components/StreakMap'
import { addDays, localDay } from '../lib/dates'
import type { DayStat } from '../lib/hooks'

/** Dev-only (not routed in production): components with fake data for visual checks. */
export default function DevPreview() {
  const days = new Map<string, DayStat>()
  const today = new Date()
  // Deterministic pseudo-random history with a current streak.
  for (let i = 0; i < 500; i++) {
    const r = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
    if (i < 12 || r > 0.55) {
      const minutes = Math.round(5 + r * 120)
      days.set(localDay(addDays(today, -i)), { minutes, lessons: r > 0.8 ? 2 : 0, studied: minutes >= 10 })
    }
  }
  return (
    <div className="main" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1>Dev preview</h1>
      <div className="card row" style={{ gap: 40, marginBottom: 18 }}>
        {(['lit', 'ember', 'out'] as const).map((s) => (
          <div key={s} className="center">
            <Flame state={s} size={80} />
            <div className="muted">{s}</div>
          </div>
        ))}
      </div>
      <div className="card"><StreakMap days={days} /></div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="hero">
          <div className="center"><Flame state="lit" size={90} /></div>
          <div className="grow">
            <div className="big-streak">12</div>
            <div className="muted">day streak</div>
            <div className="stats">
              <div className="stat"><span className="muted">Longest streak</span><b>21 days</b></div>
              <div className="stat"><span className="muted">Last 7 days</span><b>285 min</b></div>
              <div className="stat"><span className="muted">Active days (year)</span><b>166</b></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="item">
          <div className="roster-item">
            <div className="rank">1</div>
            <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
              <Flame state="lit" size={22} />
              <div><b>Aman Sharma (you)</b> <span className="muted">12 day streak · 285 min this week</span></div>
            </div>
            <div className="row roster-actions">
              <span className="chip yes">Studied · 42m</span>
              <button className="btn secondary">Nudge</button>
              <a className="muted" href="#">Details</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
