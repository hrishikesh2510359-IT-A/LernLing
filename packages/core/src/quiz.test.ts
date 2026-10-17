import { describe, expect, it } from 'vitest'
import { parseQuizScore, quizEligible } from './quiz'

describe('parseQuizScore', () => {
  it('reads Udemy result text', () => {
    expect(parseQuizScore('Great job! You got 5 out of 5 correct.')).toEqual({ correct: 5, total: 5 })
    expect(parseQuizScore('You got 3 out of 10 correct')).toEqual({ correct: 3, total: 10 })
  })
  it('returns null when there is no score', () => {
    expect(parseQuizScore('Resume quiz Skip quiz')).toBeNull()
    expect(parseQuizScore('')).toBeNull()
  })
  it('rejects impossible scores', () => {
    expect(parseQuizScore('7 out of 5')).toBeNull()
    expect(parseQuizScore('0 out of 0')).toBeNull()
  })
})

describe('quizEligible', () => {
  const full = { correct: 5, total: 5 }
  it('needs a score', () => expect(quizEligible(120, null)).toBe(false))
  it('needs enough active time', () => {
    expect(quizEligible(10, full)).toBe(false)
    expect(quizEligible(30, full)).toBe(true)
  })
  it('needs a minimum share correct', () => {
    expect(quizEligible(60, { correct: 2, total: 5 })).toBe(false)
    expect(quizEligible(60, { correct: 3, total: 5 })).toBe(true)
    expect(quizEligible(60, { correct: 0, total: 5 })).toBe(false)
  })
})
