import { RULES } from './constants'

export interface QuizScore {
  correct: number
  total: number
}

/** Reads "You got 5 out of 5 correct." style text. Returns null if there is no score. */
export function parseQuizScore(text: string): QuizScore | null {
  const m = text.match(/(\d+)\s+out\s+of\s+(\d+)/i)
  if (!m) return null
  const correct = Number(m[1])
  const total = Number(m[2])
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0 || correct > total) return null
  return { correct, total }
}

/**
 * A quiz earns credit only after real effort: enough active time on the quiz page,
 * a shown score, and a minimum share correct. Skipping a quiz shows no score, so never counts.
 */
export function quizEligible(activeSeconds: number, score: QuizScore | null): boolean {
  if (!score) return false
  if (activeSeconds < RULES.QUIZ_MIN_ACTIVE_SECONDS) return false
  return score.correct >= 1 && score.correct / score.total >= RULES.QUIZ_MIN_SCORE
}
