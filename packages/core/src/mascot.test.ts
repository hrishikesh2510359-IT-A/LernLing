import { describe, expect, it } from 'vitest'
import { heatLevel, mascotStage } from './mascot'

describe('mascotStage', () => {
  it('maps streak to growth stage', () => {
    expect([0, 1, 6, 7, 13, 14, 29, 30, 99, 100].map(mascotStage)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5])
  })
})

describe('heatLevel', () => {
  it('is 0 with no data', () => expect(heatLevel(undefined)).toBe(0))
  it('scales with minutes', () => {
    expect(heatLevel({ minutes: 5, lessons: 0, studied: false })).toBe(1)
    expect(heatLevel({ minutes: 10, lessons: 0, studied: true })).toBe(2)
    expect(heatLevel({ minutes: 45, lessons: 0, studied: true })).toBe(3)
    expect(heatLevel({ minutes: 90, lessons: 0, studied: true })).toBe(4)
    expect(heatLevel({ minutes: 200, lessons: 0, studied: true })).toBe(5)
  })
  it('counts a lesson-only day as studied', () => {
    expect(heatLevel({ minutes: 0, lessons: 1, studied: true })).toBe(2)
  })
})
