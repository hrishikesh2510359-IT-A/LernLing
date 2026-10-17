import { useId } from 'react'

/**
 * lit   = today is recorded: ablaze (flicker, glow, rising sparks, one-time ignite burst)
 * ember = streak alive but today not recorded yet: dim, slowly breathing
 * out   = no streak: cold grey
 * Switching to "lit" restarts the ignite animation, so it flares up the moment a streak is recorded.
 */
export type FlameState = 'lit' | 'ember' | 'out'

const OUTER =
  'M32 2 C36 16 54 28 54 50 C54 68 44 78 32 78 C20 78 10 68 10 50 C10 40 16 32 22 26 C22 34 26 38 30 38 C26 26 28 12 32 2 Z'
const INNER =
  'M32 36 C36 46 46 52 46 62 C46 71 40 76 32 76 C24 76 18 71 18 62 C18 54 24 50 28 44 C29 49 31 50 33 50 C30 44 30 40 32 36 Z'
const CORE = 'M32 56 C35 60 38 63 38 68 C38 72 35 75 32 75 C29 75 26 72 26 68 C26 63 29 60 32 56 Z'

const LABEL: Record<FlameState, string> = {
  lit: 'Streak recorded today',
  ember: 'Streak waiting for today',
  out: 'No active streak',
}

export function Flame({ state, size = 64 }: { state: FlameState; size?: number }) {
  const id = useId().replace(/:/g, '')
  const fill = {
    lit: { o: `url(#fo${id})`, i: `url(#fi${id})`, c: '#fff6c8' },
    ember: { o: '#b9500f', i: '#dd8a2e', c: '#f0c36a' },
    out: { o: '#6b5d55', i: '#85766c', c: '#9b8d83' },
  }[state]

  return (
    <span
      className={`flame ${state}`}
      style={{ width: size, height: size * 1.25 }}
      role="img"
      aria-label={LABEL[state]}
    >
      <svg viewBox="0 0 64 80" width="100%" height="100%" overflow="visible">
        <defs>
          <linearGradient id={`fo${id}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#d93a07" />
            <stop offset="0.55" stopColor="#ff7a18" />
            <stop offset="1" stopColor="#ffb02e" />
          </linearGradient>
          <linearGradient id={`fi${id}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff9d1a" />
            <stop offset="1" stopColor="#ffe066" />
          </linearGradient>
        </defs>
        <path className="fl-outer" d={OUTER} style={{ fill: fill.o }} />
        <path className="fl-inner" d={INNER} style={{ fill: fill.i }} />
        <path className="fl-core" d={CORE} style={{ fill: fill.c }} />
        {state === 'lit' && (
          <>
            <circle className="spark s1" cx="22" cy="20" r="1.8" />
            <circle className="spark s2" cx="42" cy="26" r="1.5" />
            <circle className="spark s3" cx="32" cy="12" r="1.3" />
          </>
        )}
      </svg>
    </span>
  )
}

/** Picks the flame state from today's data. */
export function flameState(studiedToday: boolean, currentStreak: number): FlameState {
  if (studiedToday) return 'lit'
  return currentStreak > 0 ? 'ember' : 'out'
}
