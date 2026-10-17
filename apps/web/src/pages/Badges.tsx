import { useEffect } from 'react'
import { useUserId } from '../lib/auth'
import { useAsync } from '../lib/hooks'
import { must } from '../lib/query'
import { supabase } from '../lib/supabase'

const ICONS: Record<string, string> = {
  streak_3: '🔥', streak_7: '🌱', streak_14: '🎒', streak_30: '🧭', streak_100: '👑',
  first_lesson: '📘', first_course: '🎓', night_owl: '🌙', early_bird: '🌅', quiz_master: '🧠',
}

interface Badge { id: string; name: string; description: string }

export default function Badges() {
  const uid = useUserId()
  const { data, loading, error, reload } = useAsync(async () => {
    const [catalog, mine] = await Promise.all([
      supabase.from('badges').select('id, name, description'),
      supabase.from('user_badges').select('badge_id').eq('user_id', uid),
    ])
    return {
      catalog: must(catalog) as Badge[],
      earned: new Set(must(mine).map((r) => r.badge_id as string)),
    }
  }, [uid])

  // Check for newly earned badges, then refresh the list.
  useEffect(() => {
    void supabase.rpc('award_my_badges').then(() => reload())
  }, [reload])

  if (loading) return <div className="spinner">Loading…</div>
  if (error || !data) return <p className="error">{error}</p>

  const order = Object.keys(ICONS)
  const sorted = [...data.catalog].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
  return (
    <div className="grid">
      <h1>Badges</h1>
      <p className="muted">{data.earned.size} of {data.catalog.length} earned</p>
      <div className="badge-grid">
        {sorted.map((b) => (
          <div key={b.id} className={`badge ${data.earned.has(b.id) ? '' : 'locked'}`}>
            <div className="ico">{ICONS[b.id] ?? '⭐'}</div>
            <h3>{b.name}</h3>
            <div className="muted">{b.description}</div>
            <div className="chip" style={{ marginTop: 8, display: 'inline-block' }}>
              {data.earned.has(b.id) ? 'Earned' : 'Locked'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
