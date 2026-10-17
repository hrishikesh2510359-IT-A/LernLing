/** "Hrishikesh G" -> "Hrishikesh". Falls back to "there" when there is no name. */
export function firstName(displayName: string | null | undefined): string {
  const first = (displayName ?? '').trim().split(/\s+/)[0]
  return first || 'there'
}

export function timeGreeting(now: Date = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Hello'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
