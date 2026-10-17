import { browser } from 'wxt/browser'
import {
  LessonCreditLimiter,
  TrackingEngine,
  lessonEligible,
  parseCourseraUrl,
  parseGenericUrl,
  parseQuizScore,
  parseUdemyUrl,
  quizEligible,
  type Context,
  type QuizScore,
  type LessonEvent,
  type PageInfo,
} from '@lernling/core'
import {
  CONFIG_KEY,
  DEFAULT_TYPES,
  TOASTS_KEY,
  type ContentMsg,
  type ProgressChoice,
  type SiteConfig,
  type UploadResponse,
} from './messages'
import { showToast } from './toast'

export type SiteKind = 'udemy' | 'coursera' | 'generic'

function pageInfo(kind: SiteKind): PageInfo | null {
  const url = new URL(location.href)
  if (kind === 'udemy') return parseUdemyUrl(url)
  if (kind === 'coursera') return parseCourseraUrl(url)
  return parseGenericUrl(url)
}

/** Largest video on the page that is actually loaded: the lecture player. */
function findVideo(): HTMLVideoElement | null {
  let best: HTMLVideoElement | null = null
  let bestArea = 0
  for (const v of document.querySelectorAll('video')) {
    const area = v.clientWidth * v.clientHeight
    if (area > bestArea && v.readyState > 0) {
      best = v
      bestArea = area
    }
  }
  return best
}

async function loadTypes(kind: SiteKind): Promise<Set<ProgressChoice>> {
  if (kind !== 'generic') return new Set(DEFAULT_TYPES)
  const r = await browser.storage.local.get(CONFIG_KEY)
  const cfg = (r[CONFIG_KEY] ?? {}) as Record<string, SiteConfig>
  return new Set(cfg[location.hostname]?.types ?? ['active'])
}

async function toastsEnabled(): Promise<boolean> {
  const r = await browser.storage.local.get(TOASTS_KEY)
  return r[TOASTS_KEY] !== false
}

export function startTracker(kind: SiteKind): void {
  const engine = new TrackingEngine()
  const limiter = new LessonCreditLimiter()
  const pendingLessons: LessonEvent[] = []
  const endedHooked = new WeakSet<HTMLVideoElement>()

  let types = new Set<ProgressChoice>()
  let lastInput = Date.now()
  let locked = false
  let lastCtx: Context | null = null
  let lastTitle = ''

  void loadTypes(kind).then((t) => (types = t))
  browser.storage.onChanged.addListener(() => void loadTypes(kind).then((t) => (types = t)))

  const bump = () => {
    lastInput = Date.now()
  }
  for (const ev of ['mousemove', 'keydown', 'scroll', 'click', 'wheel', 'touchstart'] as const) {
    window.addEventListener(ev, bump, { capture: true, passive: true })
  }

  // Friend nudges from the background worker show as an in-page card too.
  browser.runtime.onMessage.addListener((msg: unknown) => {
    const m = msg as ContentMsg
    if (m?.type === 'nudgeToast' && document.visibilityState === 'visible') {
      void toastsEnabled().then((on) => on && showToast({ kind: 'nudge', title: m.title, body: m.body }))
    }
  })

  async function refreshLock() {
    try {
      locked = (await browser.runtime.sendMessage({ type: 'isLocked' })) === true
    } catch {
      /* extension reloaded; page will be refreshed by the user */
    }
  }
  setInterval(refreshLock, 5000)

  function currentPage(video: HTMLVideoElement | null): { ctx: Context; pageKind: PageInfo['pageKind'] } | null {
    const info = pageInfo(kind)
    if (!info) return null
    const ctx: Context = {
      platform: info.platform,
      courseKey: info.courseKey,
      lessonKey: info.lessonKey,
    }
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      ctx.durationSeconds = video.duration
    }
    return { ctx, pageKind: info.pageKind }
  }

  // ---- quizzes ----
  const quizActiveSeconds = new Map<string, number>()
  const creditedQuizzes = new Set<string>()
  const quizKey = (c: Context) => `${c.platform}|${c.courseKey}|${c.lessonKey}`
  const CREDITED_KEY = 'creditedQuizzes'
  let lastQuizLog = 0

  void browser.storage.local.get(CREDITED_KEY).then((r) => {
    for (const k of (r[CREDITED_KEY] as string[] | undefined) ?? []) creditedQuizzes.add(k)
  })

  /** Reads the score from the page. Only Udemy is verified; Coursera quizzes are not detected yet. */
  function readQuizScore(): QuizScore | null {
    if (kind !== 'udemy') return null
    const el = document.querySelector('[data-purpose="results-summary"]')
    return el ? parseQuizScore(el.textContent ?? '') : null
  }

  function handleQuiz(ctx: Context, now: number, visible: boolean) {
    if (!ctx.lessonKey) return
    const key = quizKey(ctx)

    // Time spent on the quiz page counts as study time and toward the quiz's effort check.
    engine.sampleActive({ t: now, visible, systemIdle: locked, lastInputAt: lastInput, ctx })
    if (visible && !locked && now - lastInput <= 60_000) {
      quizActiveSeconds.set(key, (quizActiveSeconds.get(key) ?? 0) + 1)
    }

    const score = readQuizScore()
    if (now - lastQuizLog >= 5000) {
      lastQuizLog = now
      console.debug('[Lernling] quiz', {
        key,
        activeSeconds: quizActiveSeconds.get(key) ?? 0,
        score,
        alreadyCredited: creditedQuizzes.has(key),
        visible,
        locked,
      })
    }

    if (creditedQuizzes.has(key)) return
    if (!quizEligible(quizActiveSeconds.get(key) ?? 0, score)) return
    if (!limiter.tryCredit(now)) return

    creditedQuizzes.add(key)
    void browser.storage.local.set({ [CREDITED_KEY]: [...creditedQuizzes].slice(-500) })
    pendingLessons.push({
      platform: ctx.platform,
      courseKey: ctx.courseKey,
      lessonKey: ctx.lessonKey,
      courseTitle: ctx.courseKey,
      lessonTitle: lastTitle,
      kind: 'quiz',
      occurredAt: new Date().toISOString(),
    })
    void flush(true, 'quiz')
  }

  function hookEnded(video: HTMLVideoElement) {
    if (endedHooked.has(video)) return
    endedHooked.add(video)
    video.addEventListener('ended', () => {
      // Use the context captured just before the page moved on to the next lesson.
      const ctx = lastCtx
      if (!ctx || !ctx.lessonKey || !types.has('lesson')) return
      if (!lessonEligible(engine.getLessonStats(ctx))) return
      if (!limiter.tryCredit(Date.now())) return
      pendingLessons.push({
        platform: ctx.platform,
        courseKey: ctx.courseKey,
        lessonKey: ctx.lessonKey,
        courseTitle: ctx.courseKey,
        lessonTitle: lastTitle,
        kind: 'lesson',
        occurredAt: new Date().toISOString(),
      })
      void flush(true, 'lesson')
    })
  }

  function tick() {
    const video = findVideo()
    const page = currentPage(video)
    if (!page) return
    const { ctx, pageKind } = page
    lastCtx = ctx
    lastTitle = document.title.slice(0, 200)

    const now = Date.now()
    const visible = document.visibilityState === 'visible' || !!document.pictureInPictureElement

    if (pageKind === 'quiz' && kind !== 'generic' && types.has('lesson')) {
      handleQuiz(ctx, now, visible)
      return
    }

    if (video && types.has('watch')) {
      hookEnded(video)
      engine.sampleVideo({
        t: now,
        mediaTime: video.currentTime,
        playing: !video.paused && !video.ended && video.readyState > 2,
        rate: video.playbackRate,
        visible,
        muted: video.muted || video.volume === 0,
        systemIdle: locked,
        lastInputAt: lastInput,
        ctx,
      })
    } else if (!video && types.has('active')) {
      engine.sampleActive({ t: now, visible, systemIdle: locked, lastInputAt: lastInput, ctx })
    }
  }
  setInterval(tick, 1000)

  async function flush(all: boolean, credited: 'lesson' | 'quiz' | null = null) {
    const minutes = engine.drain(Date.now(), all)
    const lessons = pendingLessons.splice(0)
    if (minutes.length === 0 && lessons.length === 0) return
    let res: UploadResponse
    try {
      res = (await browser.runtime.sendMessage({ type: 'upload', minutes, lessons })) as UploadResponse
    } catch {
      return
    }
    if (!res || !res.ok || !(await toastsEnabled())) return

    const r = res.result
    if (r.newly_studied) {
      showToast({
        kind: 'day',
        title: 'Day counted!',
        body: r.streak > 0 ? `${r.streak} day streak. Nice work.` : 'You studied today.',
      })
    } else if (credited && lessons.length > 0) {
      showToast({
        kind: 'lesson',
        title: credited === 'quiz' ? 'Quiz done!' : 'Lesson done!',
        body:
          credited === 'quiz'
            ? `${r.active_minutes} min of study today. Keep going!`
            : `${r.active_minutes} min and ${r.lessons_done} lesson${r.lessons_done === 1 ? '' : 's'} today.`,
      })
    }
  }

  setInterval(() => void flush(false), 15_000)
  // Best effort when the tab closes or hides.
  window.addEventListener('pagehide', () => void flush(true))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush(true)
  })
}
