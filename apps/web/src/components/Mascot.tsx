import type { MascotMood, MascotStage } from '@lernling/core'

/**
 * PLACEHOLDER red panda. Final art comes later; every screen uses this one
 * component with stage + mood, so swapping the art touches only this file.
 */
export function Mascot({
  stage = 1,
  mood = 'happy',
  size = 140,
}: {
  stage?: MascotStage
  mood?: MascotMood
  size?: number
}) {
  const eyesClosed = mood === 'sleepy' || stage === 0
  return (
    <svg viewBox="0 0 120 130" width={size} height={size * (130 / 120)} role="img" aria-label="Red panda mascot">
      {/* ears */}
      <circle cx="28" cy="34" r="16" fill="#b8431d" />
      <circle cx="28" cy="35" r="8" fill="#fff" />
      <circle cx="92" cy="34" r="16" fill="#b8431d" />
      <circle cx="92" cy="35" r="8" fill="#fff" />
      {/* head */}
      <ellipse cx="60" cy="70" rx="43" ry="38" fill="#e25d33" />
      {/* white cheeks + muzzle */}
      <ellipse cx="38" cy="82" rx="16" ry="13" fill="#fff" />
      <ellipse cx="82" cy="82" rx="16" ry="13" fill="#fff" />
      <ellipse cx="60" cy="88" rx="13" ry="10" fill="#fff" />
      {/* eyes */}
      {eyesClosed ? (
        <>
          <path d="M34 68 q7 6 14 0" stroke="#2c211d" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M72 68 q7 6 14 0" stroke="#2c211d" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : mood === 'celebrating' ? (
        <>
          <path d="M34 70 q7 -8 14 0" stroke="#2c211d" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M72 70 q7 -8 14 0" stroke="#2c211d" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="41" cy="67" r="5" fill="#2c211d" />
          <circle cx="79" cy="67" r="5" fill="#2c211d" />
          <circle cx="43" cy="65" r="1.8" fill="#fff" />
          <circle cx="81" cy="65" r="1.8" fill="#fff" />
        </>
      )}
      {mood === 'sad' && (
        <>
          <path d="M34 58 l14 -4" stroke="#2c211d" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M86 58 l-14 -4" stroke="#2c211d" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {/* nose + mouth */}
      <ellipse cx="60" cy="83" rx="5.5" ry="4" fill="#2c211d" />
      {mood === 'sad' ? (
        <path d="M53 94 q7 -5 14 0" stroke="#2c211d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M53 89 q7 7 14 0" stroke="#2c211d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      {/* stage accessories */}
      {stage >= 1 && stage <= 2 && (
        <ellipse cx="96" cy="22" rx="14" ry="5" fill="#3d8a5a" transform="rotate(-35 96 22)" />
      )}
      {stage === 3 && <path d="M30 112 q30 18 60 0" stroke="#7c6e65" strokeWidth="5" fill="none" strokeLinecap="round" />}
      {stage === 4 && <path d="M22 108 q38 18 76 0 v12 q-38 18 -76 0z" fill="#3d8a5a" />}
      {stage === 5 && <path d="M40 40 l6 -18 l14 12 l14 -12 l6 18z" fill="#f59e0b" stroke="#b8431d" strokeWidth="1.5" />}
      {mood === 'sleepy' && (
        <text x="92" y="30" fontSize="16" fontWeight="800" fill="#7c6e65">
          z z
        </text>
      )}
    </svg>
  )
}
