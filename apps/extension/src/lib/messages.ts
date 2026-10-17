import type { ActivityMinute, LessonEvent } from '@lernling/core'

export type ProgressChoice = 'watch' | 'lesson' | 'active'

export interface SiteConfig {
  types: ProgressChoice[]
}

/** What the server returns after an upload. */
export interface IngestResult {
  day: string
  active_minutes: number
  lessons_done: number
  studied: boolean
  newly_studied: boolean
  streak: number
  longest: number
}

export type UploadResponse = { ok: true; result: IngestResult } | { ok: false; queued: boolean; reason: string }

export type Msg =
  | { type: 'upload'; minutes: ActivityMinute[]; lessons: LessonEvent[] }
  | { type: 'isLocked' }
  | { type: 'signIn' }
  | { type: 'signOut' }
  | { type: 'trackSite'; origin: string; hostname: string; types: ProgressChoice[] }

/** Sent from the background worker to pages where the content script runs. */
export type ContentMsg = { type: 'nudgeToast'; title: string; body: string }

export const DEFAULT_TYPES: ProgressChoice[] = ['watch', 'lesson']
export const CONFIG_KEY = 'siteConfig'
export const TOASTS_KEY = 'toastsEnabled'
