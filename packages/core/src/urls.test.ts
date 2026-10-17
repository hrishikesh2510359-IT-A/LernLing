import { describe, expect, it } from 'vitest'
import { parseCourseraUrl, parseGenericUrl, parseUdemyUrl } from './urls'

describe('parseUdemyUrl', () => {
  it('reads a lecture page', () => {
    const r = parseUdemyUrl(new URL('https://www.udemy.com/course/react-the-complete-guide/learn/lecture/12345678?start=0'))
    expect(r).toEqual({ platform: 'udemy', courseKey: 'react-the-complete-guide', lessonKey: 'lecture:12345678', pageKind: 'lecture' })
  })
  it('reads a quiz page', () => {
    expect(parseUdemyUrl(new URL('https://www.udemy.com/course/x/learn/quiz/99'))?.pageKind).toBe('quiz')
  })
  it('knows the course but no lesson on the learn home', () => {
    expect(parseUdemyUrl(new URL('https://www.udemy.com/course/x/learn/'))?.lessonKey).toBeNull()
  })
  it('ignores non-course pages', () => {
    expect(parseUdemyUrl(new URL('https://www.udemy.com/'))).toBeNull()
  })
})

describe('parseCourseraUrl', () => {
  it('reads a lecture page', () => {
    const r = parseCourseraUrl(new URL('https://www.coursera.org/learn/machine-learning/lecture/abc12/what-is-ml'))
    expect(r).toEqual({ platform: 'coursera', courseKey: 'machine-learning', lessonKey: 'lecture:abc12', pageKind: 'lecture' })
  })
  it('flags quizzes and readings', () => {
    expect(parseCourseraUrl(new URL('https://www.coursera.org/learn/x/quiz/q1/t'))?.pageKind).toBe('quiz')
    expect(parseCourseraUrl(new URL('https://www.coursera.org/learn/x/supplement/s1/t'))?.pageKind).toBe('other')
  })
  it('ignores non-course pages', () => {
    expect(parseCourseraUrl(new URL('https://www.coursera.org/browse'))).toBeNull()
  })
})

describe('parseGenericUrl', () => {
  it('uses host as course and path as lesson', () => {
    expect(parseGenericUrl(new URL('https://example.com/a/b'))).toMatchObject({ courseKey: 'example.com', lessonKey: '/a/b' })
  })
})
