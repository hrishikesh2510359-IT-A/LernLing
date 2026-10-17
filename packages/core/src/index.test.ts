import { describe, expect, it } from 'vitest'
import { isStudiedDay } from './index'

describe('isStudiedDay', () => {
  it('counts enough active minutes', () => {
    expect(isStudiedDay({ activeMinutes: 10, lessonsDone: 0, quizzesDone: 0 })).toBe(true)
  })
  it('does not count too few minutes', () => {
    expect(isStudiedDay({ activeMinutes: 9, lessonsDone: 0, quizzesDone: 0 })).toBe(false)
  })
  it('counts a credited lesson or a quiz alone', () => {
    expect(isStudiedDay({ activeMinutes: 0, lessonsDone: 1, quizzesDone: 0 })).toBe(true)
    expect(isStudiedDay({ activeMinutes: 0, lessonsDone: 0, quizzesDone: 1 })).toBe(true)
  })
  it('respects a custom group threshold', () => {
    expect(isStudiedDay({ activeMinutes: 20, lessonsDone: 0, quizzesDone: 0 }, 30)).toBe(false)
  })
})
