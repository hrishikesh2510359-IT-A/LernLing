import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { localDay } from '../lib/dates'
import { supabase } from '../lib/supabase'
import { useAsync } from '../lib/hooks'
import { Flame, flameState } from './Flame'
import { Mascot } from './Mascot'

export function LoginCard({ returnPath = '/' }: { returnPath?: string }) {
  const { signIn } = useAuth()
  return (
    <div className="centered">
      <div className="card narrow center">
        <Mascot stage={1} mood="happy" size={120} />
        <h1>Lernling</h1>
        <p>Study streaks with friends. Sign in to see your streakmap and your group.</p>
        <button className="btn" onClick={() => void signIn(returnPath)}>Sign in with Google</button>
        <p className="muted">Your group can see your study minutes, streak and course names (you can hide course names in Settings).</p>
      </div>
    </div>
  )
}

export default function Layout() {
  const { session, loading, signOut } = useAuth()
  const streak = useAsync(async () => {
    if (!session) return { current: 0, studied: false, name: '', avatar: '' }
    const uid = session.user.id
    const [s, t, p] = await Promise.all([
      supabase.from('streaks').select('current').eq('user_id', uid).maybeSingle(),
      supabase.from('daily_summary').select('studied').eq('user_id', uid).eq('day', localDay()).maybeSingle(),
      supabase.from('profiles').select('display_name, avatar_url').eq('id', uid).maybeSingle(),
    ])
    return {
      current: (s.data?.current as number | undefined) ?? 0,
      studied: (t.data?.studied as boolean | undefined) ?? false,
      name: (p.data?.display_name as string | undefined) ?? '',
      avatar: (p.data?.avatar_url as string | undefined) ?? '',
    }
  }, [session?.user.id])

  // Keep the flame current while the dashboard stays open.
  const reloadStreak = streak.reload
  useEffect(() => {
    const t = setInterval(() => void reloadStreak(), 20_000)
    return () => clearInterval(t)
  }, [reloadStreak])

  if (loading) return <div className="spinner">Loading…</div>
  if (!session) return <LoginCard returnPath={window.location.pathname} />

  // The name people chose in Settings wins; fall back to the Google name, then the email.
  const name =
    streak.data?.name ||
    (session.user.user_metadata?.full_name as string | undefined) ||
    session.user.email ||
    'You'
  const avatar = streak.data?.avatar || ''
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Lernling</div>
        <nav className="nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/group">Group</NavLink>
          <NavLink to="/badges">Badges</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </aside>
      <div className="main">
        <div className="topbar">
          <span className="pill">
            <Flame state={flameState(streak.data?.studied ?? false, streak.data?.current ?? 0)} size={16} />
            {streak.data?.current ?? 0} days
          </span>
          <span className="who">
            {avatar ? (
              <img className="avatar" src={avatar} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="avatar">{name.trim().charAt(0).toUpperCase()}</span>
            )}
            <span className="who-name">{name}</span>
          </span>
          <button className="btn ghost" onClick={() => void signOut()}>Sign out</button>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
