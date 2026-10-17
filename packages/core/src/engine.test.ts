import { describe, expect, it } from 'vitest'
import { LessonCreditLimiter, TrackingEngine, lessonEligible, type VideoSample } from './engine'

const ctx = { platform: 'udemy' as const, courseKey: 'c1', lessonKey: 'l1', durationSeconds: 600 }
const T0 = Date.UTC(2026, 0, 1, 10, 0, 0)

function base(over: Partial<VideoSample> = {}): VideoSample {
  return {
    t: T0,
    mediaTime: 0,
    playing: true,
    rate: 1,
    visible: true,
    muted: false,
    systemIdle: false,
    lastInputAt: T0,
    ctx,
    ...over,
  }
}

/** Feed `seconds` one-second samples, advancing media by `rate` each second. */
function play(e: TrackingEngine, seconds: number, over: Partial<VideoSample> = {}, startMedia = 0, startT = T0) {
  const rate = over.rate ?? 1
  for (let i = 0; i <= seconds; i++) {
    e.sampleVideo(base({ t: startT + i * 1000, mediaTime: startMedia + i * rate, lastInputAt: startT, ...over }))
  }
}

const totalActive = (e: TrackingEngine) =>
  e.drain(T0 + 3_600_000, true).reduce((n, m) => n + m.activeSeconds, 0)

describe('TrackingEngine video', () => {
  it('credits real watching', () => {
    const e = new TrackingEngine()
    play(e, 120)
    expect(totalActive(e)).toBe(120)
  })

  it('credits sped-up watching as real seconds, with more content covered', () => {
    const e = new TrackingEngine()
    play(e, 60, { rate: 2 })
    const mins = e.drain(T0 + 3_600_000, true)
    expect(mins.reduce((n, m) => n + m.activeSeconds, 0)).toBe(60)
    expect(mins.reduce((n, m) => n + m.contentSeconds, 0)).toBe(120)
  })

  it('does not credit above the max playback rate', () => {
    const e = new TrackingEngine()
    play(e, 30, { rate: 8 })
    expect(totalActive(e)).toBe(0)
  })

  it('gives nothing while paused', () => {
    const e = new TrackingEngine()
    play(e, 30, { playing: false })
    expect(totalActive(e)).toBe(0)
  })

  it('gives nothing in a hidden tab', () => {
    const e = new TrackingEngine()
    play(e, 30, { visible: false })
    expect(totalActive(e)).toBe(0)
  })

  it('gives nothing when the system is idle or locked', () => {
    const e = new TrackingEngine()
    play(e, 30, { systemIdle: true })
    expect(totalActive(e)).toBe(0)
  })

  it('stops crediting after 10 minutes with no input', () => {
    const e = new TrackingEngine()
    // Input at T0, then 12 minutes of playback.
    for (let i = 0; i <= 720; i++) {
      e.sampleVideo(base({ t: T0 + i * 1000, mediaTime: i, lastInputAt: T0 }))
    }
    const secs = totalActive(e)
    expect(secs).toBeGreaterThanOrEqual(599)
    expect(secs).toBeLessThanOrEqual(601)
  })

  it('does not credit a forward seek but marks it skimmed, and keeps crediting after', () => {
    const e = new TrackingEngine()
    play(e, 10)
    // jump 200s ahead, then watch 10 more seconds
    play(e, 10, {}, 210, T0 + 11_000)
    expect(totalActive(e)).toBe(20)
    const stats = e.getLessonStats(ctx)!
    expect(stats.skimmedSeconds).toBeGreaterThan(150)
  })

  it('does not credit a long gap (worker slept)', () => {
    const e = new TrackingEngine()
    e.sampleVideo(base({ t: T0, mediaTime: 0 }))
    e.sampleVideo(base({ t: T0 + 60_000, mediaTime: 60 }))
    expect(totalActive(e)).toBe(0)
  })

  it('splits credit across minute buckets', () => {
    const e = new TrackingEngine()
    play(e, 120)
    const mins = e.drain(T0 + 3_600_000, true)
    expect(mins.length).toBeGreaterThanOrEqual(2)
    expect(mins.every((m) => m.activeSeconds <= 60)).toBe(true)
  })

  it('does not drain the in-progress minute unless flushed', () => {
    const e = new TrackingEngine()
    play(e, 30)
    expect(e.drain(T0 + 30_000)).toHaveLength(0)
    expect(e.drain(T0 + 30_000, true).length).toBe(1)
  })
})

describe('TrackingEngine active (non-video)', () => {
  it('credits only with recent input and a visible tab', () => {
    const e = new TrackingEngine()
    const mk = (t: number, over = {}) => ({
      t, visible: true, systemIdle: false, lastInputAt: t - 5_000, ctx, ...over,
    })
    for (let i = 0; i <= 30; i++) e.sampleActive(mk(T0 + i * 1000))
    for (let i = 31; i <= 60; i++) e.sampleActive(mk(T0 + i * 1000, { lastInputAt: T0 - 600_000 }))
    expect(totalActive(e)).toBe(30)
  })
})

describe('lesson credit', () => {
  it('needs enough watched time and coverage', () => {
    expect(lessonEligible(undefined)).toBe(false)
    expect(lessonEligible({ watchedSeconds: 30, contentSeconds: 600, skimmedSeconds: 0, durationSeconds: 600 })).toBe(false)
    expect(lessonEligible({ watchedSeconds: 90, contentSeconds: 60, skimmedSeconds: 0, durationSeconds: 600 })).toBe(false)
    expect(lessonEligible({ watchedSeconds: 90, contentSeconds: 90, skimmedSeconds: 100, durationSeconds: 600 })).toBe(true)
  })

  it('rate-limits lesson credits per hour', () => {
    const l = new LessonCreditLimiter()
    for (let i = 0; i < 6; i++) expect(l.tryCredit(T0 + i)).toBe(true)
    expect(l.tryCredit(T0 + 10)).toBe(false)
    expect(l.tryCredit(T0 + 3_600_001)).toBe(true)
  })
})
