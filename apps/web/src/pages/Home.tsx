import { useEffect } from 'react'
import { mascotStage, STAGE_NAMES, type MascotMood } from '@lernling/core'
import { Mascot } from '../components/Mascot'
import { Flame, flameState } from '../components/Flame'
import { StreakMap } from '../components/StreakMap'
import { Ring } from '../components/charts'
import { useUserId } from '../lib/auth'
import { addDays, lastNDays, localDay, shortDate } from '../lib/dates'
import { useAsync, type DayStat } from '../lib/hooks'
import { must } from '../lib/query'
import { supabase } from '../lib/supabase'

interface Session {
  day: string
  platform: string
  course_key: string
  minutes: number
  lessons: number
}

export default function Home() {
  const uid = useUserId()

  useEffect(() => {
    void supabase.rpc('award_my_badges')
  }, [])

  const { data, loading, error, reload } = useAsync(async () => {
    const since = localDay(addDays(new Date(), -730))
    const [sums, streak, groups, sessions, nudges] = await Promise.all([
      supabase.from('daily_summary').select('day, active_minutes, lessons_done, studied').eq('user_id', uid).gte('day', since),
      supabase.from('streaks').select('current, longest').eq('user_id', uid).maybeSingle(),
      supabase.from('group_members').select('groups(daily_threshold_min)').eq('user_id', uid),
      supabase.rpc('member_sessions', { p_user: uid, p_limit: 12 }),
      supabase
        .from('nudges')
        .select('id, sent_at, from:profiles!from_user(display_name)')
        .eq('to_user', uid)
        .gte('sent_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order('sent_at', { ascending: false }),
    ])
    const days = new Map<string, DayStat>()
    for (const r of must(sums)) {
      days.set(r.day as string, { minutes: r.active_minutes, lessons: r.lessons_done, studied: r.studied })
    }
    const thresholds = (must(groups) as unknown as { groups: { daily_threshold_min: number } | null }[])
      .map((g) => g.groups?.daily_threshold_min)
      .filter((n): n is number => typeof n === 'number')
    return {
      days,
      current: streak.data?.current ?? 0,
      longest: streak.data?.longest ?? 0,
      threshold: thresholds.length ? Math.min(...thresholds) : 10,
      sessions: (must(sessions) ?? []) as Session[],
      nudges: (nudges.data ?? []).map((n) => ({
        id: n.id as string,
        name: (n.from as unknown as { display_name: string } | null)?.display_name ?? 'A friend',
      })),
    }
  }, [uid])

  // Refresh while the page is open so the flame ignites when a streak gets recorded.
  useEffect(() => {
    const t = setInterval(() => void reload(), 20_000)
    return () => clearInterval(t)
  }, [reload])

  if (loading) return <div className="spinner">Loading…</div>
  if (error || !data) return <p className="error">{error || 'Could not load.'}</p>

  const today = data.days.get(localDay())
  const weekMinutes = lastNDays(7).reduce((n, d) => n + (data.days.get(d)?.minutes ?? 0), 0)
  const activeDays = [...data.days.values()].filter((d) => d.studied).length
  const studiedToday = today?.studied ?? false
  const mood: MascotMood = studiedToday ? 'happy' : data.current === 0 && data.longest > 0 ? 'sad' : 'sleepy'
  const stage = mascotStage(data.current)

  return (
    <div className="grid">
      <h1>{studiedToday ? 'Day counted. Nice work!' : 'Ready to study today?'}</h1>

      {!studiedToday && data.nudges.length > 0 && (
        <div className="notice" style={{ border: '1px solid var(--l2)' }}>
          👋 <b>{[...new Set(data.nudges.map((n) => n.name))].join(', ')}</b>{' '}
          nudged you today. Study a little to keep your streak alive.
        </div>
      )}

      <div className="grid cols-2">
        <div className="card">
          <div className="hero">
            <div className="center">
              <Mascot stage={stage} mood={mood} interactive />
              <div className="muted">{STAGE_NAMES[stage]}</div>
            </div>
            <div className="grow">
              <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                <Flame state={flameState(studiedToday, data.current)} size={64} />
                <div>
                  <div className="big-streak">{data.current}</div>
                  <div className="muted">day streak{studiedToday ? '' : data.current > 0 ? ' · study today to keep it' : ''}</div>
                </div>
              </div>
              <div className="stats">
                <div className="stat"><span className="muted">Longest streak</span><b>{data.longest} days</b></div>
                <div className="stat"><span className="muted">Last 7 days</span><b>{weekMinutes} min</b></div>
                <div className="stat"><span className="muted">Active days (year)</span><b>{activeDays}</b></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Today</h3>
          <Ring value={today?.minutes ?? 0} max={data.threshold} label={`of ${data.threshold} min`} />
          <p className="muted center">
            {studiedToday
              ? 'Day counted ✓'
              : `Study ${data.threshold} min, finish a lesson or pass a quiz to count today.`}
          </p>
        </div>
      </div>

      <div className="card">
        <StreakMap days={data.days} />
      </div>

      <div className="card">
        <h2>Recent study</h2>
        {data.sessions.length === 0 ? (
          <p className="muted">Nothing yet. Open Udemy or Coursera with the extension on and start a lecture.</p>
        ) : (
          <div className="list" style={{ marginTop: 10 }}>
            {data.sessions.map((s, i) => (
              <div className="item row" key={i}>
                <span className="chip plat">{s.platform}</span>
                <span className="grow"><b>{s.course_key}</b></span>
                <span className="muted">{s.lessons > 0 ? `${s.lessons} lesson${s.lessons === 1 ? '' : 's'} · ` : ''}{s.minutes} min</span>
                <span className="muted">{shortDate(s.day)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
