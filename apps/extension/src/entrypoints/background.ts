import { browser } from 'wxt/browser'
import type { ActivityMinute, LessonEvent } from '@lernling/core'
import { supabase } from '../lib/supabase'
import {
  CONFIG_KEY,
  type ContentMsg,
  type IngestResult,
  type Msg,
  type SiteConfig,
  type UploadResponse,
} from '../lib/messages'

const QUEUE_KEY = 'uploadQueue'
const NOTIFIED_KEY = 'notifiedNudges'
const DASHBOARD_URL = (import.meta.env.WXT_DASHBOARD_URL as string | undefined) || 'https://lernling.vercel.app'

interface QueueItem {
  minutes: ActivityMinute[]
  lessons: LessonEvent[]
}

let locked = false

export default defineBackground(() => {
  browser.idle.setDetectionInterval(60)
  browser.idle.onStateChanged.addListener((state) => {
    locked = state === 'locked'
  })

  browser.alarms.create('flush', { periodInMinutes: 1 })
  browser.alarms.create('nudges', { periodInMinutes: 1 })
  browser.alarms.onAlarm.addListener((a) => {
    if (a.name === 'flush') void flushQueue()
    if (a.name === 'nudges') void checkNudges()
  })
  void checkNudges()

  // Clicking a nudge opens the group page on the dashboard.
  browser.notifications.onClicked.addListener((id) => {
    if (!id.startsWith('nudge-')) return
    void browser.tabs.create({ url: `${DASHBOARD_URL}/group` })
    void browser.notifications.clear(id)
  })

  browser.runtime.onMessage.addListener((msg: Msg, _sender, sendResponse) => {
    handle(msg).then(sendResponse, (e) => sendResponse({ ok: false, queued: false, reason: String(e) }))
    return true
  })
})

async function handle(msg: Msg): Promise<unknown> {
  switch (msg.type) {
    case 'isLocked':
      return locked
    case 'signIn':
      return signIn()
    case 'signOut':
      await supabase.auth.signOut()
      return true
    case 'upload':
      return upload(msg.minutes, msg.lessons)
    case 'trackSite':
      return trackSite(msg.origin, msg.hostname, msg.types)
  }
}

// ---------- auth ----------

async function signIn(): Promise<{ ok: boolean; error?: string }> {
  const redirectTo = browser.identity.getRedirectURL()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  })
  if (error || !data.url) return { ok: false, error: error?.message ?? 'No sign-in URL' }

  const responseUrl = await browser.identity.launchWebAuthFlow({ url: data.url, interactive: true })
  if (!responseUrl) return { ok: false, error: 'Sign-in cancelled' }

  const params = new URLSearchParams(new URL(responseUrl).hash.slice(1))
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (!access_token || !refresh_token) {
    return { ok: false, error: params.get('error_description') ?? 'No tokens returned' }
  }
  const { data: sess, error: setErr } = await supabase.auth.setSession({ access_token, refresh_token })
  if (setErr || !sess.user) return { ok: false, error: setErr?.message ?? 'Could not save session' }

  // Day boundaries use the user's own timezone.
  await supabase
    .from('profiles')
    .update({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    .eq('id', sess.user.id)

  void flushQueue()
  void checkNudges()
  return { ok: true }
}

// ---------- nudges ----------

/**
 * Looks for unseen nudges from the last 24 hours, marks them seen, and shows one
 * browser notification. Skipped if you have already studied today.
 */
async function checkNudges(): Promise<void> {
  // Step-by-step detail is logged at debug level (hidden unless "Verbose" is on in DevTools).
  const log = (...a: unknown[]) => console.debug('[Lernling]', ...a)
  try {
    await doCheckNudges(log)
  } catch (e) {
    console.error('[Lernling] nudge check failed', e)
  }
}

async function doCheckNudges(log: (...a: unknown[]) => void): Promise<void> {
  const { data: sess } = await supabase.auth.getSession()
  if (!sess.session) {
    log('nudges: not signed in')
    return
  }
  const uid = sess.session.user.id
  log('nudge check running for', sess.session.user.email, uid)

  // Nudges are never "consumed": they stay visible in the popup and dashboard for 24 hours.
  // We only remember which ones we already popped a notification for.
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { data: all, error } = await supabase
    .from('nudges')
    .select('id, sent_at, from:profiles!from_user(display_name)')
    .eq('to_user', uid)
    .gte('sent_at', since)
    .order('sent_at', { ascending: false })
  if (error) {
    log('nudges query failed', error.message)
    return
  }
  log('nudges to you in the last 24h:', all?.length ?? 0)
  if (!all || all.length === 0) {
    await setBadge(0)
    return
  }

  const { data: day } = await supabase
    .from('daily_summary')
    .select('studied')
    .eq('user_id', uid)
    .eq('day', new Date().toLocaleDateString('en-CA'))
    .maybeSingle()
  // The icon badge shows how many friends are waiting on you, until you study today.
  await setBadge(day?.studied ? 0 : all.length)
  if (day?.studied) {
    log('nudge notifications skipped: you already studied today')
    return
  }

  const stored = await browser.storage.local.get(NOTIFIED_KEY)
  const notified = new Set((stored[NOTIFIED_KEY] as string[] | undefined) ?? [])
  const data = all.filter((n) => !notified.has(n.id as string))
  log('not yet notified:', data.length)
  if (data.length === 0) return
  await browser.storage.local.set({
    [NOTIFIED_KEY]: [...notified, ...data.map((n) => n.id as string)].slice(-200),
  })

  const names = [
    ...new Set(
      data.map((n) => (n.from as unknown as { display_name: string } | null)?.display_name ?? 'A friend'),
    ),
  ]
  const who = names.length === 1 ? names[0]! : `${names[0]} and ${names.length - 1} other${names.length > 2 ? 's' : ''}`
  const id = await browser.notifications.create(`nudge-${Date.now()}`, {
    type: 'basic',
    iconUrl: browser.runtime.getURL('/icon/128.png'),
    title: `${who} nudged you`,
    message: 'Study a little today to keep your streak alive.',
    priority: 1,
  })
  log('notification shown', id)

  // Also show a card inside any open page where Lernling is running (Udemy, Coursera, tracked sites).
  const toast: ContentMsg = {
    type: 'nudgeToast',
    title: `${who} nudged you`,
    body: 'Study a little today to keep your streak alive.',
  }
  for (const tab of await browser.tabs.query({})) {
    if (tab.id !== undefined) browser.tabs.sendMessage(tab.id, toast).catch(() => {})
  }
}

async function setBadge(count: number): Promise<void> {
  await browser.action.setBadgeText({ text: count > 0 ? String(count) : '' })
  if (count > 0) await browser.action.setBadgeBackgroundColor({ color: '#e25d33' })
}

// ---------- upload queue ----------

async function readQueue(): Promise<QueueItem[]> {
  const r = await browser.storage.local.get(QUEUE_KEY)
  return (r[QUEUE_KEY] as QueueItem[] | undefined) ?? []
}

async function writeQueue(q: QueueItem[]) {
  await browser.storage.local.set({ [QUEUE_KEY]: q })
}

async function upload(minutes: ActivityMinute[], lessons: LessonEvent[]): Promise<UploadResponse> {
  const q = await readQueue()
  q.push({ minutes, lessons })
  await writeQueue(q)
  return flushQueue()
}

let flushing: Promise<UploadResponse> | null = null

/** Sends everything queued. Safe to retry: the server keeps the larger value per minute. */
function flushQueue(): Promise<UploadResponse> {
  flushing ??= doFlush().finally(() => (flushing = null))
  return flushing
}

async function doFlush(): Promise<UploadResponse> {
  const { data: sess } = await supabase.auth.getSession()
  if (!sess.session) return { ok: false, queued: true, reason: 'not signed in' }

  const q = await readQueue()
  if (q.length === 0) return { ok: false, queued: false, reason: 'nothing to send' }

  const minutes = q.flatMap((i) => i.minutes).map((m) => ({
    minute_ts: m.minuteTs,
    platform: m.platform,
    course_key: m.courseKey,
    lesson_key: m.lessonKey,
    kind: m.kind,
    active_seconds: m.activeSeconds,
    content_seconds: m.contentSeconds,
    muted: m.muted,
  }))
  const lessons = q.flatMap((i) => i.lessons).map((l) => ({
    platform: l.platform,
    course_key: l.courseKey,
    lesson_key: l.lessonKey,
    course_title: l.courseTitle,
    lesson_title: l.lessonTitle,
    kind: l.kind,
  }))

  const { data, error } = await supabase.rpc('ingest_activity', { p_minutes: minutes, p_lessons: lessons })
  if (error) return { ok: false, queued: true, reason: error.message }

  // Only drop what we sent; new items may have been queued meanwhile.
  const now = await readQueue()
  await writeQueue(now.slice(q.length))
  return { ok: true, result: data as IngestResult }
}

// ---------- tracking extra sites ----------

async function trackSite(origin: string, hostname: string, types: SiteConfig['types']) {
  const granted = await browser.permissions.contains({ origins: [origin] })
  if (!granted) return { ok: false, error: 'permission not granted' }

  const r = await browser.storage.local.get(CONFIG_KEY)
  const cfg = (r[CONFIG_KEY] ?? {}) as Record<string, SiteConfig>
  cfg[hostname] = { types }
  await browser.storage.local.set({ [CONFIG_KEY]: cfg })

  const id = `lernling-${hostname}`
  try {
    await browser.scripting.unregisterContentScripts({ ids: [id] })
  } catch {
    /* not registered yet */
  }
  await browser.scripting.registerContentScripts([
    {
      id,
      matches: [origin],
      js: ['generic.js'],
      runAt: 'document_idle',
      persistAcrossSessions: true,
    },
  ])

  // Keep a copy on the server so it follows the user to other browsers.
  const { data: sess } = await supabase.auth.getSession()
  if (sess.session) {
    await supabase
      .from('site_settings')
      .upsert({ user_id: sess.session.user.id, hostname, platform: 'generic', progress_types: types })
  }
  return { ok: true }
}
