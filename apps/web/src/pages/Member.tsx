import { Link, useParams } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { Flame, flameState } from '../components/Flame'
import { MemberMap } from '../components/StreakMap'
import { BarChart, type Bar } from '../components/charts'
import { useUserId } from '../lib/auth'
import { addDays, lastNDays, localDay, shortDate } from '../lib/dates'
import { useAsync } from '../lib/hooks'
import { must } from '../lib/query'
import { supabase } from '../lib/supabase'
import { mascotStage } from '@lernling/core'

interface Course { platform: string; course_key: string; minutes: number; lessons: number; last_active: string }
interface Session { day: string; platform: string; course_key: string; minutes: number; lessons: number }
interface Activity { day: string; watch_minutes: number; other_minutes: number; content_minutes: number }

/**
 * Member detail. Everyone in the group sees summary numbers. The group owner
 * (and the member themselves) also see the split between watched video and
 * other study time, courses, and recent sessions.
 */
export default function Member() {
  const { groupId, userId } = useParams()
  const me = useUserId()

  const { data, loading, error } = useAsync(async () => {
    const [group, profile, streak] = await Promise.all([
      supabase.from('groups').select('name, owner_id, daily_threshold_min').eq('id', groupId!).single(),
      supabase.from('profiles').select('display_name').eq('id', userId!).single(),
      supabase.from('streaks').select('current, longest').eq('user_id', userId!).maybeSingle(),
    ])
    const g = must(group)
    const detailed = g.owner_id === me || userId === me

    const since = localDay(addDays(new Date(), -29))
    const sums = must(
      await supabase.from('daily_summary').select('day, active_minutes, lessons_done, studied').eq('user_id', userId!).gte('day', since),
    )

    let activity: Activity[] = []
    let courses: Course[] = []
    let sessions: Session[] = []
    if (detailed) {
      const [a, c, s] = await Promise.all([
        supabase.rpc('member_activity', { p_user: userId!, p_days: 30 }),
        supabase.rpc('member_courses', { p_user: userId! }),
        supabase.rpc('member_sessions', { p_user: userId!, p_limit: 20 }),
      ])
      activity = (must(a) ?? []) as Activity[]
      courses = (must(c) ?? []) as Course[]
      sessions = (must(s) ?? []) as Session[]
    }
    return {
      groupName: g.name as string,
      threshold: g.daily_threshold_min as number,
      name: must(profile).display_name as string,
      current: streak.data?.current ?? 0,
      longest: streak.data?.longest ?? 0,
      studiedToday: sums.some((r) => r.day === localDay() && r.studied),
      sums,
      activity,
      courses,
      sessions,
      detailed,
    }
  }, [groupId, userId, me])

  if (loading) return <div className="spinner">Loading…</div>
  if (error || !data) return <p className="error">{error || 'Not found.'}</p>

  const minutesByDay = new Map(data.sums.map((r) => [r.day as string, r.active_minutes as number]))
  const actByDay = new Map(data.activity.map((r) => [r.day, r]))
  const bars: Bar[] = lastNDays(30).map((day) => {
    const a = actByDay.get(day)
    return a ? { day, a: a.watch_minutes, b: a.other_minutes } : { day, a: minutesByDay.get(day) ?? 0, b: 0 }
  })
  const totalMin = bars.reduce((n, b) => n + b.a + b.b, 0)
  const activeDays = bars.filter((b) => b.a + b.b > 0).length
  const lessons = data.sums.reduce((n, r) => n + (r.lessons_done as number), 0)
  const contentMin = data.activity.reduce((n, r) => n + r.content_minutes, 0)

  return (
    <div className="grid">
      <Link to={`/group/${groupId}`} className="muted">← Back to {data.groupName}</Link>

      <div className="card">
        <div className="hero">
          <Mascot stage={mascotStage(data.current)} mood={data.current > 0 ? 'happy' : 'sleepy'} size={90} />
          <div className="grow">
            <h1>{data.name}{userId === me ? ' (you)' : ''}</h1>
            <div className="stats">
              <div className="stat">
                <span className="muted">Current streak</span>
                <b className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                  <Flame state={flameState(data.studiedToday, data.current)} size={26} /> {data.current}
                </b>
              </div>
              <div className="stat"><span className="muted">Best streak</span><b>{data.longest} days</b></div>
              <div className="stat"><span className="muted">Last 30 days</span><b>{totalMin} min</b></div>
              <div className="stat"><span className="muted">Lessons (30 d)</span><b>{lessons}</b></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <MemberMap userId={userId!} />
      </div>

      <div className="card">
        <h2>30-day study</h2>
        <p className="muted">{activeDays} active days. Goal line is the group's daily goal.</p>
        <BarChart
          bars={bars}
          goal={data.threshold}
          aLabel={data.detailed ? 'Watched video' : 'Study minutes'}
          bLabel={data.detailed ? 'Other active study' : undefined}
        />
        {data.detailed && contentMin > 0 && (
          <p className="muted">Covered {contentMin} min of video content, which can be more than time spent when watched sped up.</p>
        )}
      </div>

      {data.detailed ? (
        <>
          <div className="card">
            <h2>Courses</h2>
            {data.courses.length === 0 ? <p className="muted">No tracked courses yet.</p> : (
              <div className="list" style={{ marginTop: 10 }}>
                {data.courses.map((c, i) => (
                  <div className="item row" key={i}>
                    <span className="chip plat">{c.platform}</span>
                    <span className="grow"><b>{c.course_key}</b></span>
                    <span className="muted">{c.lessons} lesson{c.lessons === 1 ? '' : 's'} · {c.minutes} min</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2>Recent sessions</h2>
            {data.sessions.length === 0 ? <p className="muted">No sessions yet.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Platform</th><th>Course</th><th>Minutes</th><th>Lessons</th></tr></thead>
                  <tbody>
                    {data.sessions.map((s, i) => (
                      <tr key={i}>
                        <td>{shortDate(s.day)}</td>
                        <td><span className="chip plat">{s.platform}</span></td>
                        <td>{s.course_key}</td>
                        <td>{s.minutes}</td>
                        <td>{s.lessons}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="notice">Only the group owner can see courses and session details.</div>
      )}
    </div>
  )
}
