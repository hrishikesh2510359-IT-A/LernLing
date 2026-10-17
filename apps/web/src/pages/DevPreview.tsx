import { Flame } from '../components/Flame'
import { StreakMap } from '../components/StreakMap'
import { StripHeatmap } from '../components/Heatmap'
import { Ring } from '../components/charts'
import { Mascot } from '../components/Mascot'
import { addDays, localDay } from '../lib/dates'
import type { DayStat } from '../lib/hooks'

function fakeDays(seed: number): Map<string, DayStat> {
  const days = new Map<string, DayStat>()
  const today = new Date()
  for (let i = 0; i < 500; i++) {
    const r = Math.abs(Math.sin((i + seed) * 12.9898) * 43758.5453) % 1
    if (i < 12 || r > 0.55) {
      const minutes = Math.round(5 + r * 120)
      days.set(localDay(addDays(today, -i)), { minutes, lessons: r > 0.8 ? 2 : 0, studied: minutes >= 10 })
    }
  }
  return days
}

/**
 * Dev-only (not routed in production): the real app shell with fake data, to check
 * layout at laptop sizes without signing in. Open /dev on the local dev server.
 */
export default function DevPreview() {
  const days = fakeDays(0)
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Lernling</div>
        <nav className="nav">
          <a className="active" href="#">Home</a>
          <a href="#">Group</a>
          <a href="#">Badges</a>
          <a href="#">Settings</a>
        </nav>
      </aside>
      <div className="main">
        <div className="topbar">
          <span className="pill"><Flame state="lit" size={16} /> 12 days</span>
          <span className="muted">Hrishikesh G</span>
          <button className="btn ghost">Sign out</button>
        </div>

        <div className="grid">
          <h1>Day counted. Nice work!</h1>

          {/* Home layout */}
          <div className="grid cols-2">
            <div className="card">
              <div className="hero">
                <div className="center"><Mascot stage={2} mood="happy" /><div className="muted">Playful cub</div></div>
                <div className="grow">
                  <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <Flame state="lit" size={64} />
                    <div><div className="big-streak">12</div><div className="muted">day streak</div></div>
                  </div>
                  <div className="stats">
                    <div className="stat"><span className="muted">Longest streak</span><b>21 days</b></div>
                    <div className="stat"><span className="muted">Last 7 days</span><b>285 min</b></div>
                    <div className="stat"><span className="muted">Active days (year)</span><b>166</b></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <h3>Today</h3>
              <Ring value={12} max={10} label="of 10 min" />
            </div>
          </div>
          <div className="card"><StreakMap days={days} /></div>

          {/* Group layout, with an expanded streak map */}
          <div className="card">
            <div className="row">
              <div className="grow"><h1>Quartet</h1><p className="muted">2 members · daily goal 10 min</p></div>
              <button className="btn">Copy invite link</button>
            </div>
          </div>
          <div className="grid cols-2">
            <div className="card">
              <h2>This week</h2>
              <p className="muted">Ranked by study minutes in the last 7 days. Squares show the last 30 days.</p>
              <div className="list" style={{ marginTop: 12 }}>
                {['Hrishikesh G (you)', 'DoppelHerr'].map((n, i) => (
                  <div className="item" key={n}>
                    <div className="roster-item">
                      <div className="rank">{i + 1}</div>
                      <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                        <Flame state="lit" size={22} />
                        <div><b>{n}</b> <span className="muted">12 day streak · 285 min this week</span></div>
                      </div>
                      <div className="row roster-actions">
                        <span className="chip yes">Studied · 42m</span>
                        <button className="btn secondary">Nudge</button>
                        <a className="muted" href="#">Details</a>
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}><StripHeatmap days={fakeDays(i)} /></div>
                    {i === 0 && (
                      <div className="card" style={{ marginTop: 8, boxShadow: 'none' }}><StreakMap days={fakeDays(3)} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid" style={{ alignContent: 'start' }}>
              <div className="card"><h3>Invite code</h3><p><code>00809725</code></p><p className="muted">Anyone with this link can join. Share it only with people you trust.</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
