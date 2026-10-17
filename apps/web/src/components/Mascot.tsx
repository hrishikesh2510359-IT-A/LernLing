import { useEffect, useRef, useState } from 'react'
import type { MascotMood, MascotStage } from '@lernling/core'

/**
 * Lernling's baby red panda. Flat, geometric, Duolingo-style, drawn as layers so one set of
 * parts covers every combination: 6 growth stages (accessories + size) x 4 moods (face + pose).
 * Animation is plain CSS (see "mascot" in style.css), so there is no animation library.
 *
 * Palette is fixed here on purpose: the mascot looks the same in light and dark mode.
 */
const C = {
  rust: '#E25D33',
  rustDark: '#B8431D',
  cream: '#FFF4E6',
  brown: '#3A2E29',
  ink: '#2C211D',
  blush: '#FF9E7A',
  mouth: '#7A2E1B',
  tongue: '#FF8A7A',
  green: '#3D8A5A',
  greenLight: '#7BC47F',
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  pack: '#9A6A3F',
}

const CONFETTI = [
  { x: 40, c: '#F59E0B', d: 0, s: 7 },
  { x: 62, c: '#3D8A5A', d: 0.25, s: 6 },
  { x: 84, c: '#E25D33', d: 0.5, s: 7 },
  { x: 112, c: '#FBBF24', d: 0.1, s: 6 },
  { x: 134, c: '#7BC47F', d: 0.4, s: 7 },
  { x: 158, c: '#E25D33', d: 0.65, s: 6 },
  { x: 100, c: '#FFFFFF', d: 0.8, s: 5 },
]

export function Mascot({
  stage = 1,
  mood = 'happy',
  size = 140,
  animate = true,
  interactive = false,
}: {
  stage?: MascotStage
  mood?: MascotMood
  size?: number
  /** Turn off all motion (e.g. for tiny avatars). Reduced-motion users get none either way. */
  animate?: boolean
  /** Click the panda for a little "boop" reaction. */
  interactive?: boolean
}) {
  const [boop, setBoop] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const closedEyes = mood === 'sleepy' || stage === 0
  const scale = stage === 0 ? 0.8 : 1
  const classes = [
    'mascot',
    `m-${mood}`,
    `m-s${stage}`,
    animate ? 'm-animated' : '',
    interactive ? 'm-interactive' : '',
    boop ? 'm-boop' : '',
  ]
    .filter(Boolean)
    .join(' ')

  function onBoop() {
    if (!interactive || boop) return
    setBoop(true)
    timer.current = window.setTimeout(() => setBoop(false), 700)
  }

  return (
    <svg
      className={classes}
      viewBox="0 0 200 230"
      width={size}
      height={size * 1.15}
      role="img"
      aria-label={`Red panda mascot, ${mood}`}
      onClick={onBoop}
    >
      <g transform={`translate(100 224) scale(${scale}) translate(-100 -224)`}>
        {/* key = stage, so growing to a new stage replays the pop-in */}
        <g key={stage} className="m-grow">
          <g className="m-root">
            {stage === 5 && <Cape />}

            {/* tail: rust with darker rings */}
            <g className="m-tail">
              <path d="M146 190 C198 188 208 132 172 108" fill="none" stroke={C.rust} strokeWidth="30" strokeLinecap="round" />
              <path
                d="M146 190 C198 188 208 132 172 108"
                fill="none" stroke={C.rustDark} strokeWidth="30" strokeDasharray="9 16" strokeDashoffset="4"
              />
              <path d="M146 190 C198 188 208 132 172 108" fill="none" stroke={C.rust} strokeWidth="30" strokeLinecap="round" strokeDasharray="0 400" />
            </g>

            {stage === 3 && <Backpack />}

            {/* body */}
            <g className="m-body">
              <ellipse cx="100" cy="170" rx="52" ry="44" fill={C.rust} />
              <ellipse cx="100" cy="174" rx="34" ry="34" fill={C.brown} />
              {/* legs */}
              <rect x="64" y="194" width="30" height="28" rx="14" fill={C.brown} />
              <rect x="106" y="194" width="30" height="28" rx="14" fill={C.brown} />
              {stage === 3 && <Straps />}
              {stage === 4 && <Scarf />}
            </g>

            {/* arms (rotate from the shoulder) */}
            <g className="m-arm m-arm-l">
              <ellipse cx="56" cy="170" rx="12" ry="24" fill={C.brown} />
            </g>
            <g className="m-arm m-arm-r">
              {stage === 2 && <Bamboo />}
              <ellipse cx="144" cy="170" rx="12" ry="24" fill={C.brown} />
            </g>

            {/* head */}
            <g className="m-head">
              <g className="m-ear m-ear-l">
                <circle cx="56" cy="54" r="19" fill={C.rustDark} />
                <circle cx="56" cy="56" r="10" fill={C.cream} />
              </g>
              <g className="m-ear m-ear-r">
                <circle cx="144" cy="54" r="19" fill={C.rustDark} />
                <circle cx="144" cy="56" r="10" fill={C.cream} />
              </g>

              {/* fluffy cheek tufts */}
              <path d="M48 94 L20 106 L50 120 Z" fill={C.cream} />
              <path d="M152 94 L180 106 L150 120 Z" fill={C.cream} />
              <ellipse cx="100" cy="98" rx="64" ry="52" fill={C.rust} />

              {/* white markings */}
              <ellipse cx="78" cy="68" rx="10" ry="5" transform="rotate(-18 78 68)" fill={C.cream} />
              <ellipse cx="122" cy="68" rx="10" ry="5" transform="rotate(18 122 68)" fill={C.cream} />
              <ellipse cx="66" cy="114" rx="27" ry="20" fill={C.cream} />
              <ellipse cx="134" cy="114" rx="27" ry="20" fill={C.cream} />
              <ellipse cx="100" cy="120" rx="23" ry="17" fill={C.cream} />
              {/* tear marks */}
              <path d="M72 113 Q67 124 60 130" fill="none" stroke={C.rustDark} strokeWidth="4.5" strokeLinecap="round" />
              <path d="M128 113 Q133 124 140 130" fill="none" stroke={C.rustDark} strokeWidth="4.5" strokeLinecap="round" />

              <Face mood={mood} closed={closedEyes} />

              {stage === 1 && <Leaf />}
              {stage === 5 && <Crown />}
            </g>

            {mood === 'celebrating' && <Confetti />}
            {mood === 'sleepy' && <Zzz />}
            {stage === 5 && <Sparkles />}
          </g>
        </g>
      </g>
    </svg>
  )
}

function Face({ mood, closed }: { mood: MascotMood; closed: boolean }) {
  const eyesOpen = !closed && mood !== 'celebrating'
  return (
    <g>
      {mood === 'celebrating' && (
        <>
          <ellipse cx="60" cy="116" rx="9" ry="5.5" fill={C.blush} opacity="0.75" />
          <ellipse cx="140" cy="116" rx="9" ry="5.5" fill={C.blush} opacity="0.75" />
        </>
      )}

      {/* eyes */}
      {eyesOpen && (
        <g className="m-eyes">
          <g className="m-eye">
            <ellipse cx="76" cy="98" rx="9.5" ry="12.5" fill={C.ink} />
            <circle cx="79.5" cy="92.5" r="3.6" fill="#fff" />
            <circle cx="73" cy="103" r="1.8" fill="#fff" />
          </g>
          <g className="m-eye">
            <ellipse cx="124" cy="98" rx="9.5" ry="12.5" fill={C.ink} />
            <circle cx="127.5" cy="92.5" r="3.6" fill="#fff" />
            <circle cx="121" cy="103" r="1.8" fill="#fff" />
          </g>
        </g>
      )}
      {!eyesOpen && mood === 'celebrating' && (
        <>
          <path d="M65 104 Q76 90 87 104" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
          <path d="M113 104 Q124 90 135 104" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {!eyesOpen && mood !== 'celebrating' && (
        <>
          <path d="M65 99 Q76 111 87 99" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
          <path d="M113 99 Q124 111 135 99" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {mood === 'sad' && (
        <>
          <path d="M65 87 L88 78" stroke={C.ink} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M135 87 L112 78" stroke={C.ink} strokeWidth="4.5" strokeLinecap="round" />
          <path className="m-tear" d="M88 112 Q92 120 88 124 Q84 120 88 112 Z" fill="#7FB8E8" />
        </>
      )}

      {/* nose + mouth */}
      <ellipse cx="100" cy="109" rx="7.5" ry="5.5" fill={C.ink} />
      {mood === 'celebrating' ? (
        <>
          <path d="M86 118 Q100 144 114 118 Z" fill={C.mouth} />
          <ellipse cx="100" cy="132" rx="7" ry="4.5" fill={C.tongue} />
        </>
      ) : mood === 'sad' ? (
        <path d="M91 126 Q100 117 109 126" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
      ) : mood === 'sleepy' || closed ? (
        <path d="M95 119 Q100 124 105 119" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d="M89 117 Q100 130 111 117" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
      )}
    </g>
  )
}

/* ---------- stage accessories ---------- */

function Leaf() {
  return (
    <g className="m-leaf">
      <ellipse cx="116" cy="44" rx="15" ry="6" transform="rotate(-28 116 44)" fill={C.greenLight} />
      <ellipse cx="128" cy="52" rx="12" ry="5" transform="rotate(10 128 52)" fill={C.green} />
    </g>
  )
}

function Bamboo() {
  return (
    <g>
      <rect x="152" y="118" width="9" height="104" rx="4" fill={C.greenLight} />
      <rect x="152" y="150" width="9" height="3" fill={C.green} />
      <rect x="152" y="184" width="9" height="3" fill={C.green} />
      <ellipse cx="170" cy="126" rx="14" ry="5.5" transform="rotate(-25 170 126)" fill={C.green} />
      <ellipse cx="142" cy="136" rx="13" ry="5" transform="rotate(25 142 136)" fill={C.greenLight} />
    </g>
  )
}

function Backpack() {
  return (
    <g>
      <rect x="34" y="146" width="26" height="60" rx="12" fill={C.pack} />
      <rect x="140" y="146" width="26" height="60" rx="12" fill={C.pack} />
    </g>
  )
}

function Straps() {
  return (
    <g fill="none" stroke={C.pack} strokeWidth="7" strokeLinecap="round">
      <path d="M78 138 Q74 160 76 184" />
      <path d="M122 138 Q126 160 124 184" />
    </g>
  )
}

function Scarf() {
  return (
    <g>
      <path d="M56 136 Q100 160 144 136 L144 154 Q100 178 56 154 Z" fill={C.green} />
      <path d="M118 158 L132 192 L114 186 Z" fill="#2E7348" />
      <path d="M70 146 Q100 162 130 146" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeDasharray="4 8" />
    </g>
  )
}

function Cape() {
  return <path d="M50 134 L24 218 Q100 232 176 218 L150 134 Z" fill={C.gold} />
}

function Crown() {
  return (
    <g className="m-crown">
      <path d="M72 54 L80 24 L94 44 L100 18 L106 44 L120 24 L128 54 Z" fill={C.goldLight} />
      <rect x="72" y="50" width="56" height="8" rx="4" fill={C.gold} />
      <circle cx="100" cy="30" r="3.5" fill={C.rust} />
    </g>
  )
}

function Sparkles() {
  const spots = [
    { x: 30, y: 60, d: 0 },
    { x: 172, y: 70, d: 0.7 },
    { x: 24, y: 150, d: 1.3 },
    { x: 178, y: 160, d: 0.4 },
  ]
  return (
    <g>
      {spots.map((s) => (
        <path
          key={s.x}
          className="m-sparkle"
          style={{ animationDelay: `${s.d}s`, transformOrigin: `${s.x}px ${s.y}px` }}
          d={`M${s.x} ${s.y - 9} L${s.x + 2.6} ${s.y - 2.6} L${s.x + 9} ${s.y} L${s.x + 2.6} ${s.y + 2.6} L${s.x} ${s.y + 9} L${s.x - 2.6} ${s.y + 2.6} L${s.x - 9} ${s.y} L${s.x - 2.6} ${s.y - 2.6} Z`}
          fill={C.goldLight}
        />
      ))}
    </g>
  )
}

/* ---------- mood effects ---------- */

function Confetti() {
  return (
    <g>
      {CONFETTI.map((p, i) => (
        <rect
          key={i}
          className="m-confetti"
          style={{ animationDelay: `${p.d}s` }}
          x={p.x}
          y={-10}
          width={p.s}
          height={p.s * 1.6}
          rx="1.5"
          fill={p.c}
        />
      ))}
    </g>
  )
}

function Zzz() {
  return (
    <g fontWeight="800" fill="#8C7A70" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif">
      <text className="m-z" style={{ animationDelay: '0s' }} x="150" y="52" fontSize="22">Z</text>
      <text className="m-z" style={{ animationDelay: '1s' }} x="166" y="38" fontSize="16">z</text>
      <text className="m-z" style={{ animationDelay: '2s' }} x="178" y="26" fontSize="12">z</text>
    </g>
  )
}
