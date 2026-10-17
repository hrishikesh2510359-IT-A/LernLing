import { RULES } from './constants'
import type { DailySummary } from './types'

export * from './constants'
export * from './types'
export * from './engine'
export * from './urls'
export * from './mascot'
export * from './quiz'

/** A day counts if enough active minutes, or a credited lesson, or a quiz. */
export function isStudiedDay(
  s: Pick<DailySummary, 'activeMinutes' | 'lessonsDone' | 'quizzesDone'>,
  thresholdMin: number = RULES.DAILY_THRESHOLD_MIN,
): boolean {
  return s.activeMinutes >= thresholdMin || s.lessonsDone >= 1 || s.quizzesDone >= 1
}
