import { useCallback, useEffect, useState, type DependencyList } from 'react'

/** Runs an async loader; returns data, loading and error, plus a reload function. */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps)

  const reload = useCallback(async () => {
    try {
      setData(await run())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [run])

  useEffect(() => {
    setLoading(true)
    void reload()
  }, [reload])

  return { data, error, loading, reload }
}

export interface DayStat {
  minutes: number
  lessons: number
  studied: boolean
}
