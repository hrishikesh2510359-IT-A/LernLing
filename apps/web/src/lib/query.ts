/** Unwraps a Supabase response, throwing its error so pages can show it. */
export function must<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message)
  if (res.data === null || res.data === undefined) throw new Error('Not found')
  return res.data as NonNullable<T>
}
