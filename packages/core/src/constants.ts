/** Tracking rules from PLAN.md section 3. Change here, not in call sites. */
export const RULES = {
  /** Default minutes of verified activity for a day to count (group owner can change). */
  DAILY_THRESHOLD_MIN: 10,
  /** Highest playback speed that still earns watch credit. */
  MAX_PLAYBACK_RATE: 4,
  /** Stop crediting playback after this long with no user input. */
  IDLE_NO_INPUT_MS: 10 * 60 * 1000,
  /** Ticks are grouped into segments of this size before upload. */
  SEGMENT_SECONDS: 30,
  /** Lesson credit needs at least this much watched time... */
  LESSON_MIN_WATCH_SECONDS: 60,
  /** ...and this fraction of the lesson watched or skimmed. */
  LESSON_MIN_COVERAGE: 0.25,
  MAX_LESSON_CREDITS_PER_HOUR: 6,
  /** A quiz needs this much active time on its page before a result counts. */
  QUIZ_MIN_ACTIVE_SECONDS: 30,
  /** And at least this share of answers correct. */
  QUIZ_MIN_SCORE: 0.5,
  /** Counted minutes per day never exceed this. */
  DAILY_CAP_MIN: 12 * 60,
  FREEZES_PER_WEEK: 1,
  STREAK_MILESTONES: [3, 7, 14, 30, 100],
} as const
