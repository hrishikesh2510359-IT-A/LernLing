import type { Platform } from './types'

export interface PageInfo {
  platform: Platform
  courseKey: string
  /** null when the page is not a lesson (course home, catalog, ...). */
  lessonKey: string | null
  /** What kind of lesson page this is. */
  pageKind: 'lecture' | 'quiz' | 'other'
}

/** https://www.udemy.com/course/<slug>/learn/lecture/<id> */
export function parseUdemyUrl(url: URL): PageInfo | null {
  const m = url.pathname.match(/^\/course\/([^/]+)\/learn\/(lecture|quiz)\/(\d+)/)
  if (m) {
    return {
      platform: 'udemy',
      courseKey: m[1]!,
      lessonKey: `${m[2]}:${m[3]}`,
      pageKind: m[2] === 'quiz' ? 'quiz' : 'lecture',
    }
  }
  const c = url.pathname.match(/^\/course\/([^/]+)\/learn/)
  if (c) return { platform: 'udemy', courseKey: c[1]!, lessonKey: null, pageKind: 'other' }
  return null
}

/** https://www.coursera.org/learn/<slug>/lecture/<id>/<title> */
export function parseCourseraUrl(url: URL): PageInfo | null {
  const m = url.pathname.match(/^\/learn\/([^/]+)\/(lecture|quiz|supplement|exam|assignment)\/([^/]+)/)
  if (m) {
    const kind = m[2]!
    return {
      platform: 'coursera',
      courseKey: m[1]!,
      lessonKey: `${kind}:${m[3]}`,
      pageKind: kind === 'lecture' ? 'lecture' : kind === 'quiz' || kind === 'exam' ? 'quiz' : 'other',
    }
  }
  const c = url.pathname.match(/^\/learn\/([^/]+)/)
  if (c) return { platform: 'coursera', courseKey: c[1]!, lessonKey: null, pageKind: 'other' }
  return null
}

/** Any other site: the hostname is the "course", the path is the "lesson". */
export function parseGenericUrl(url: URL): PageInfo {
  return {
    platform: 'generic',
    courseKey: url.hostname,
    lessonKey: url.pathname || '/',
    pageKind: 'other',
  }
}
