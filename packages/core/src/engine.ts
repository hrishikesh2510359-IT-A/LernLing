import { RULES } from './constants'
import type { ActivityMinute, Platform } from './types'

export interface Context {
  platform: Platform
  courseKey: string
  lessonKey: string | null
  /** Lesson length in seconds, if known. Used for coverage. */
  durationSeconds?: number
}

export interface VideoSample {
  /** Epoch ms. Sampled about once per second by the content script. */
  t: number
  /** video.currentTime in seconds. */
  mediaTime: number
  playing: boolean
  rate: number
  /** Tab visible, or video is in Picture-in-Picture. */
  visible: boolean
  muted: boolean
  /** OS idle or locked (chrome.idle). */
  systemIdle: boolean
  /** Epoch ms of the last keyboard/mouse/scroll input, null if unknown. */
  lastInputAt: number | null
  ctx: Context
}

export interface ActiveSample {
  t: number
  visible: boolean
  systemIdle: boolean
  lastInputAt: number | null
  ctx: Context
}

export interface LessonStats {
  watchedSeconds: number
  contentSeconds: number
  skimmedSeconds: number
  durationSeconds: number | null
}

interface Bucket {
  minute: number
  platform: Platform
  courseKey: string
  lessonSeconds: Map<string, number>
  activeSeconds: number
  contentSeconds: number
  mutedSeconds: number
  video: boolean
}

/** Longest gap between samples we still treat as continuous. Longer = worker slept or tab froze. */
const MAX_GAP_S = 5
/** Window in which input must have happened for non-video "active" study. */
const ACTIVE_INPUT_WINDOW_MS = 60_000

/**
 * Turns raw samples into verified minute buckets and per-lesson stats.
 * Pure logic: no browser APIs, so it is fully unit-testable.
 * See PLAN.md section 3 for the rules.
 */
export class TrackingEngine {
  private prevVideo: VideoSample | null = null
  private prevActive: ActiveSample | null = null
  private buckets = new Map<number, Bucket>()
  private lessons = new Map<string, LessonStats>()

  sampleVideo(s: VideoSample): void {
    const prev = this.prevVideo
    this.prevVideo = s
    if (!prev) return

    const dt = (s.t - prev.t) / 1000
    if (dt <= 0 || dt > MAX_GAP_S) return
    if (!prev.playing || !s.playing) return
    if (sameLesson(prev.ctx, s.ctx) === false) return

    const dMedia = s.mediaTime - prev.mediaTime
    const expected = dt * s.rate
    const stats = this.statsFor(s.ctx)
    if (s.ctx.durationSeconds) stats.durationSeconds = s.ctx.durationSeconds

    // Forward jump much bigger than playback explains = a seek. Skimmed, not credited.
    if (dMedia > expected * 1.5 + 0.5) {
      stats.skimmedSeconds += dMedia
      return
    }
    // Backward seek or no movement (buffering, frozen): nothing.
    if (dMedia <= 0) return

    if (s.rate > RULES.MAX_PLAYBACK_RATE) return
    if (!s.visible || s.systemIdle) return
    if (s.lastInputAt !== null && s.t - s.lastInputAt > RULES.IDLE_NO_INPUT_MS) return

    stats.watchedSeconds += dt
    stats.contentSeconds += dMedia
    this.credit(s.t, s.ctx, dt, dMedia, s.muted, true)
  }

  sampleActive(s: ActiveSample): void {
    const prev = this.prevActive
    this.prevActive = s
    if (!prev) return

    const dt = (s.t - prev.t) / 1000
    if (dt <= 0 || dt > MAX_GAP_S) return
    if (!s.visible || s.systemIdle) return
    if (s.lastInputAt === null || s.t - s.lastInputAt > ACTIVE_INPUT_WINDOW_MS) return

    this.credit(s.t, s.ctx, dt, 0, false, false)
  }

  /** Stats for a lesson, for completion checks. */
  getLessonStats(ctx: Pick<Context, 'platform' | 'courseKey' | 'lessonKey'>): LessonStats | undefined {
    return this.lessons.get(lessonId(ctx))
  }

  /**
   * Returns finished minutes (all but the current one unless `flush`), ready to upload,
   * and removes them from memory.
   */
  drain(now: number, flush = false): ActivityMinute[] {
    const currentMinute = Math.floor(now / 60_000)
    const out: ActivityMinute[] = []
    for (const [minute, b] of this.buckets) {
      if (!flush && minute >= currentMinute) continue
      this.buckets.delete(minute)
      const activeSeconds = Math.min(60, Math.round(b.activeSeconds))
      if (activeSeconds < 1) continue
      out.push({
        minuteTs: new Date(minute * 60_000).toISOString(),
        platform: b.platform,
        courseKey: b.courseKey,
        lessonKey: topLesson(b.lessonSeconds),
        kind: b.video ? 'watch' : 'active',
        activeSeconds,
        contentSeconds: Math.round(b.contentSeconds),
        muted: b.mutedSeconds > b.activeSeconds / 2,
      })
    }
    return out.sort((a, b) => a.minuteTs.localeCompare(b.minuteTs))
  }

  private credit(t: number, ctx: Context, sec: number, content: number, muted: boolean, video: boolean) {
    const minute = Math.floor(t / 60_000)
    let b = this.buckets.get(minute)
    if (!b) {
      b = {
        minute,
        platform: ctx.platform,
        courseKey: ctx.courseKey,
        lessonSeconds: new Map(),
        activeSeconds: 0,
        contentSeconds: 0,
        mutedSeconds: 0,
        video,
      }
      this.buckets.set(minute, b)
    }
    b.activeSeconds += sec
    b.contentSeconds += content
    if (muted) b.mutedSeconds += sec
    if (video) b.video = true
    const lk = ctx.lessonKey ?? ''
    b.lessonSeconds.set(lk, (b.lessonSeconds.get(lk) ?? 0) + sec)
  }

  private statsFor(ctx: Context): LessonStats {
    const id = lessonId(ctx)
    let s = this.lessons.get(id)
    if (!s) {
      s = { watchedSeconds: 0, contentSeconds: 0, skimmedSeconds: 0, durationSeconds: null }
      this.lessons.set(id, s)
    }
    return s
  }
}

function lessonId(c: Pick<Context, 'platform' | 'courseKey' | 'lessonKey'>): string {
  return `${c.platform}|${c.courseKey}|${c.lessonKey ?? ''}`
}

function sameLesson(a: Context, b: Context): boolean {
  return lessonId(a) === lessonId(b)
}

function topLesson(m: Map<string, number>): string | null {
  let best: string | null = null
  let bestSec = -1
  for (const [k, v] of m) {
    if (v > bestSec) {
      best = k
      bestSec = v
    }
  }
  return best ? best : null
}

/**
 * A "mark complete" only earns lesson credit with real engagement:
 * enough watched time AND enough of the lesson watched or skimmed.
 */
export function lessonEligible(stats: LessonStats | undefined): boolean {
  if (!stats) return false
  if (stats.watchedSeconds < RULES.LESSON_MIN_WATCH_SECONDS) return false
  if (!stats.durationSeconds) return true // duration unknown: rely on watched time only
  const covered = stats.contentSeconds + stats.skimmedSeconds
  return covered / stats.durationSeconds >= RULES.LESSON_MIN_COVERAGE
}

/** Allows at most MAX_LESSON_CREDITS_PER_HOUR lesson credits in any rolling hour. */
export class LessonCreditLimiter {
  private times: number[] = []
  tryCredit(now: number): boolean {
    const hourAgo = now - 3_600_000
    this.times = this.times.filter((t) => t > hourAgo)
    if (this.times.length >= RULES.MAX_LESSON_CREDITS_PER_HOUR) return false
    this.times.push(now)
    return true
  }
}
