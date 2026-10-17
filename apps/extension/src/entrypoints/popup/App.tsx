import { useCallback, useEffect, useState } from 'react'
import { browser } from 'wxt/browser'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { CONFIG_KEY, type ProgressChoice, type SiteConfig } from '../../lib/messages'

interface Member {
  userId: string
  name: string
  streak: number
  studiedToday: boolean
  minutesToday: number
}
interface GroupView {
  id: string
  name: string
  inviteCode: string
  members: Member[]
}
interface Today {
  minutes: number
  studied: boolean
  streak: number
}

const BUILT_IN = ['udemy.com', 'coursera.org']
function ago(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  return `${Math.round(min / 60)} h ago`
}
const localDay = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in the browser's timezone

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [error, setError] = useState('')

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <p className="muted">Loading…</p>
  if (!session) return <SignedOut error={error} setError={setError} />
  return <SignedIn session={session} />
}

function SignedOut({ error, setError }: { error: string; setError: (e: string) => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <>
      <h1>Lernling 🦊</h1>
      <p>Study streaks with friends. Sign in to start tracking your learning.</p>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setError('')
          const r = (await browser.runtime.sendMessage({ type: 'signIn' })) as { ok: boolean; error?: string }
          if (!r.ok) setError(r.error ?? 'Sign-in failed')
          setBusy(false)
        }}
      >
        Sign in with Google
      </button>
      {error && <div className="error">{error}</div>}
      <p className="muted">
        Your group can see your study minutes, streak and course names. Only time you actually study counts, never
        just visiting.
      </p>
    </>
  )
}

function SignedIn({ session }: { session: Session }) {
  const [today, setToday] = useState<Today>({ minutes: 0, studied: false, streak: 0 })
  const [groups, setGroups] = useState<GroupView[]>([])
  const [code, setCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [msg, setMsg] = useState('')
  const [nudged, setNudged] = useState<Set<string>>(new Set())
  const [nudgesIn, setNudgesIn] = useState<{ id: string; name: string; sentAt: string }[]>([])

  const load = useCallback(async () => {
    const uid = session.user.id
    const [{ data: sum }, { data: st }] = await Promise.all([
      supabase.from('daily_summary').select('active_minutes, studied').eq('user_id', uid).eq('day', localDay()).maybeSingle(),
      supabase.from('streaks').select('current').eq('user_id', uid).maybeSingle(),
    ])
    setToday({ minutes: sum?.active_minutes ?? 0, studied: sum?.studied ?? false, streak: st?.current ?? 0 })

    // Nudges from friends in the last 24 hours (stay visible even if the notification was missed).
    const { data: ns } = await supabase
      .from('nudges')
      .select('id, sent_at, from:profiles!from_user(display_name)')
      .eq('to_user', uid)
      .gte('sent_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .order('sent_at', { ascending: false })
    setNudgesIn(
      (ns ?? []).map((n) => ({
        id: n.id as string,
        name: (n.from as unknown as { display_name: string } | null)?.display_name ?? 'A friend',
        sentAt: n.sent_at as string,
      })),
    )

    const { data: gm } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, invite_code)')
      .eq('user_id', uid)
    const views: GroupView[] = []
    for (const row of gm ?? []) {
      const g = row.groups as unknown as { id: string; name: string; invite_code: string } | null
      if (!g) continue
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, profiles(display_name)')
        .eq('group_id', g.id)
      const ids = (members ?? []).map((m) => m.user_id as string)
      const [{ data: sums }, { data: streaks }] = await Promise.all([
        supabase.from('daily_summary').select('user_id, active_minutes, studied').in('user_id', ids).eq('day', localDay()),
        supabase.from('streaks').select('user_id, current').in('user_id', ids),
      ])
      views.push({
        id: g.id,
        name: g.name,
        inviteCode: g.invite_code,
        members: (members ?? []).map((m) => {
          const id = m.user_id as string
          const s = sums?.find((x) => x.user_id === id)
          return {
            userId: id,
            name: (m.profiles as unknown as { display_name: string } | null)?.display_name ?? 'Learner',
            streak: streaks?.find((x) => x.user_id === id)?.current ?? 0,
            studiedToday: s?.studied ?? false,
            minutesToday: s?.active_minutes ?? 0,
          }
        }),
      })
    }
    setGroups(views)
  }, [session.user.id])

  useEffect(() => {
    void load()
    const t = setInterval(() => void load(), 15_000)
    return () => clearInterval(t)
  }, [load])

  async function nudge(groupId: string, toUser: string) {
    const { error } = await supabase
      .from('nudges')
      .insert({ from_user: session.user.id, to_user: toUser, group_id: groupId })
    // 23505 = already nudged today: fine, show it as sent.
    if (error && error.code !== '23505') return setMsg(error.message)
    setNudged((s) => new Set(s).add(toUser))
  }

  async function join() {
    setMsg('')
    const { error } = await supabase.rpc('join_group', { code: code.trim() })
    if (error) setMsg(error.message)
    else {
      setCode('')
      void load()
    }
  }
  async function create() {
    setMsg('')
    const { error } = await supabase.rpc('create_group', { group_name: groupName.trim() })
    if (error) setMsg(error.message)
    else {
      setGroupName('')
      void load()
    }
  }

  return (
    <>
      <div className="row">
        <h1 className="grow">Hi, {session.user.user_metadata?.full_name ?? 'learner'}</h1>
        <button className="ghost" onClick={() => browser.runtime.sendMessage({ type: 'signOut' })}>
          Sign out
        </button>
      </div>

      <div className="card row">
        <div className="big">🔥 {today.streak}</div>
        <div className="grow">
          <div>{today.minutes} min today</div>
          <div className="muted">{today.studied ? 'Day counted ✓' : 'Study 10 min, finish a lesson, or pass a quiz to count today'}</div>
        </div>
      </div>

      {!today.studied && nudgesIn.length > 0 && (
        <div className="card" style={{ borderColor: '#fdba74' }}>
          <h2>Friends are nudging you</h2>
          {nudgesIn.slice(0, 3).map((n) => (
            <div key={n.id} className="row" style={{ padding: '2px 0' }}>
              <span className="grow">👋 {n.name} nudged you</span>
              <span className="muted">{ago(n.sentAt)}</span>
            </div>
          ))}
          <p className="muted" style={{ margin: '6px 0 0' }}>Study a little today to keep your streak alive.</p>
        </div>
      )}

      <TrackSite />

      {groups.map((g) => (
        <div className="card" key={g.id}>
          <h2>
            {g.name} · code {g.inviteCode}
          </h2>
          {g.members.map((m) => (
            <div className="row" key={m.userId} style={{ padding: '4px 0' }}>
              <span className="grow">
                {m.name} <span className="muted">🔥 {m.streak}</span>
              </span>
              <span className={`chip ${m.studiedToday ? 'yes' : 'no'}`}>
                {m.studiedToday ? `Studied · ${m.minutesToday}m` : 'Not yet'}
              </span>
              {!m.studiedToday && m.userId !== session.user.id && (
                <button className="secondary" disabled={nudged.has(m.userId)} onClick={() => void nudge(g.id, m.userId)}>
                  {nudged.has(m.userId) ? 'Nudged ✓' : 'Nudge'}
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      <div className="card">
        <h2>{groups.length ? 'Join or create another group' : 'Join your friends'}</h2>
        <div className="row">
          <input type="text" placeholder="Invite code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="secondary" onClick={join} disabled={!code.trim()}>
            Join
          </button>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <input type="text" placeholder="New group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          <button className="secondary" onClick={create} disabled={!groupName.trim()}>
            Create
          </button>
        </div>
        {msg && <div className="error">{msg}</div>}
      </div>
    </>
  )
}

/** "Track this site": asks for permission for the current site and picks what counts. */
function TrackSite() {
  const [site, setSite] = useState<{ origin: string; hostname: string } | null>(null)
  const [tracked, setTracked] = useState(false)
  const [types, setTypes] = useState<ProgressChoice[]>(['watch', 'lesson'])
  const [status, setStatus] = useState('')

  useEffect(() => {
    void (async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (!tab?.url || !/^https?:/.test(tab.url)) return
      const u = new URL(tab.url)
      if (BUILT_IN.some((h) => u.hostname.endsWith(h))) return
      setSite({ origin: `${u.protocol}//${u.hostname}/*`, hostname: u.hostname })
      const r = await browser.storage.local.get(CONFIG_KEY)
      const cfg = (r[CONFIG_KEY] ?? {}) as Record<string, SiteConfig>
      setTracked(!!cfg[u.hostname])
    })()
  }, [])

  if (!site) return null
  if (tracked) return <div className="card muted">Tracking {site.hostname} ✓ (reload the page if it was already open)</div>

  const toggle = (t: ProgressChoice) =>
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  async function start() {
    // permissions.request must run directly inside the click handler.
    const ok = await browser.permissions.request({ origins: [site!.origin] })
    if (!ok) return setStatus('Permission was not granted.')
    const r = (await browser.runtime.sendMessage({
      type: 'trackSite',
      origin: site!.origin,
      hostname: site!.hostname,
      types,
    })) as { ok: boolean; error?: string }
    if (r.ok) setTracked(true)
    else setStatus(r.error ?? 'Could not start tracking.')
  }

  return (
    <div className="card">
      <h2>Track {site.hostname}?</h2>
      <label className="check">
        <input type="checkbox" checked={types.includes('watch')} onChange={() => toggle('watch')} /> Watch time (video playing)
      </label>
      <label className="check">
        <input type="checkbox" checked={types.includes('lesson')} onChange={() => toggle('lesson')} /> Finished videos / lessons
      </label>
      <label className="check">
        <input type="checkbox" checked={types.includes('active')} onChange={() => toggle('active')} /> Active study time (reading, coding)
      </label>
      <button onClick={start} disabled={types.length === 0}>
        Start tracking
      </button>
      {status && <div className="error">{status}</div>}
      <p className="muted">Only time you actually study counts, never just visiting.</p>
    </div>
  )
}
