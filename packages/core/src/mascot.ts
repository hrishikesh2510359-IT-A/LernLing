export type MascotStage = 0 | 1 | 2 | 3 | 4 | 5
export type MascotMood = 'happy' | 'sleepy' | 'celebrating' | 'sad'

export const STAGE_NAMES = [
  'Sleepy newborn',
  'Cub with a bamboo leaf',
  'Playful cub',
  'Student panda',
  'Explorer panda',
  'Golden legend',
] as const

/** Growth stage from streak length (PLAN.md section 7). */
export function mascotStage(streak: number): MascotStage {
  if (streak >= 100) return 5
  if (streak >= 30) return 4
  if (streak >= 14) return 3
  if (streak >= 7) return 2
  if (streak >= 1) return 1
  return 0
}

/** Heatmap intensity 0..5 for one day. */
export function heatLevel(d: { minutes: number; lessons: number; studied: boolean } | undefined): number {
  if (!d) return 0
  if (d.minutes >= 120) return 5
  if (d.minutes >= 60) return 4
  if (d.minutes >= 30) return 3
  if (d.minutes >= 10 || d.studied) return 2
  if (d.minutes >= 1 || d.lessons >= 1) return 1
  return 0
}
