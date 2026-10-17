export type ProgressType = 'watch' | 'lesson' | 'quiz' | 'active' | 'manual'

export type Platform = 'udemy' | 'coursera' | 'generic'

/** One verified minute of study. Primary key on the server is (userId, minuteTs). */
export interface ActivityMinute {
  /** ISO timestamp truncated to the minute, UTC. */
  minuteTs: string
  platform: Platform
  courseKey: string
  lessonKey: string | null
  kind: Exclude<ProgressType, 'lesson' | 'quiz'>
  /** Real seconds of effort in this minute, 1..60. */
  activeSeconds: number
  /** Video seconds covered in this minute (greater than activeSeconds when sped up). */
  contentSeconds: number
  muted: boolean
}

export interface LessonEvent {
  platform: Platform
  courseKey: string
  lessonKey: string
  courseTitle?: string
  lessonTitle?: string
  kind: 'lesson' | 'quiz'
  occurredAt: string
}

export interface DailySummary {
  day: string // YYYY-MM-DD in the user's timezone
  activeMinutes: number
  lessonsDone: number
  quizzesDone: number
  studied: boolean
}

export interface Streak {
  current: number
  longest: number
  lastDay: string | null
  freezesAvailable: number
}
