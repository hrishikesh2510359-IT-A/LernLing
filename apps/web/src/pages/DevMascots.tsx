import { useState } from 'react'
import { Mascot } from '../components/Mascot'
import { STAGE_NAMES, type MascotMood, type MascotStage } from '@lernling/core'

const STAGES: MascotStage[] = [0, 1, 2, 3, 4, 5]
const MOODS: MascotMood[] = ['happy', 'sleepy', 'celebrating', 'sad']

/** Dev-only gallery (not routed in production): every stage and mood, with animation on or off. */
export default function DevMascots() {
  const [animate, setAnimate] = useState(true)
  return (
    <div className="main" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="row">
        <h1 className="grow">Mascot gallery</h1>
        <label className="row">
          <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} /> Animate
        </label>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Growth stages (happy)</h2>
        <div className="row" style={{ gap: 18, alignItems: 'flex-end' }}>
          {STAGES.map((s) => (
            <div key={s} className="center">
              <Mascot stage={s} mood="happy" size={130} animate={animate} interactive />
              <div className="muted">{s}: {STAGE_NAMES[s]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Moods (stage 3)</h2>
        <div className="row" style={{ gap: 28 }}>
          {MOODS.map((m) => (
            <div key={m} className="center">
              <Mascot stage={3} mood={m} size={170} animate={animate} interactive />
              <div className="muted">{m}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>Small sizes</h2>
        <div className="row" style={{ gap: 18 }}>
          {[32, 48, 64, 90].map((n) => (
            <Mascot key={n} stage={2} mood="happy" size={n} animate={animate} />
          ))}
        </div>
      </div>
    </div>
  )
}
