import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { StripHeatmap } from '../components/Heatmap'
import { MemberMap } from '../components/StreakMap'
import { Flame, flameState } from '../components/Flame'
import { useUserId } from '../lib/auth'
import { addDays, lastNDays, localDay } from '../lib/dates'
import { useAsync, type DayStat } from '../lib/hooks'
import { must } from '../lib/query'
import { supabase } from '../lib/supabase'

interface GroupRow {
  id: string
  name: string
}
interface Member {
  id: string
  name: string
  role: string
  current: number
  today: DayStat | undefined
  days: Map<string, DayStat>
  week: number
}
interface GroupData {
  id: string
  name: string
  inviteCode: string
  ownerId: string
  threshold: number
  members: Member[]
}

export default function Group() {
  const { groupId } = useParams()
  const uid = useUserId()
  const mine = useAsync(async () => {
    const rows = must(await supabase.from('group_members').select('groups(id, name)').eq('user_id', uid))
    return (rows as unknown as { groups: GroupRow | null }[]).map((r) => r.groups).filter((g): g is GroupRow => !!g)
  }, [uid, groupId])

  if (mine.loading) return <div className="spinner">Loading…</div>
  if (mine.error) return <p className="error">{mine.error}</p>
  const groups = mine.data ?? []

  if (!groupId) {
    return groups[0] ? <Navigate to={`/group/${groups[0].id}`} replace /> : <CreateOrJoin />
  }
  return (
    <div className="grid">
      {groups.length > 1 && (
        <div className="row">
          {groups.map((g) => (
            <Link key={g.id} to={`/group/${g.id}`} className={`chip ${g.id === groupId ? 'yes' : 'plat'}`}>{g.name}</Link>
          ))}
        </div>
      )}
      <GroupView groupId={groupId} />
      <CreateOrJoin compact />
    </div>
  )
}

function CreateOrJoin({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  async function join() {
    setMsg('')
    const { data, error } = await supabase.rpc('join_group', { code: code.trim() })
    if (error) return setMsg(error.message)
    navigate(`/group/${data as string}`)
  }
  async function create() {
    setMsg('')
    const { data, error } = await supabase.rpc('create_group', { group_name: name.trim() })
    if (error) return setMsg(error.message)
    navigate(`/group/${data as string}`)
  }

  return (
    <div className="card">
      {compact ? <h3>Join or create another group</h3> : (
        <>
          <h1>Study with friends</h1>
          <p className="muted">Create a group and send the invite link, or join with a code a friend gave you.</p>
        </>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        <input type="text" placeholder="Invite code" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn secondary" disabled={!code.trim()} onClick={() => void join()}>Join</button>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <input type="text" placeholder="New group name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn secondary" disabled={!name.trim()} onClick={() => void create()}>Create</button>
      </div>
      {msg && <div className="error">{msg}</div>}
    </div>
  )
}

function GroupView({ groupId }: { groupId: string }) {
  const uid = useUserId()
  const navigate = useNavigate()
  const [nudged, setNudged] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggleOpen = (id: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const [copied, setCopied] = useState(false)
  const [msg, setMsg] = useState('')

  const { data, loading, error, reload } = useAsync(async (): Promise<GroupData> => {
    const g = must(await supabase.from('groups').select('id, name, invite_code, owner_id, daily_threshold_min').eq('id', groupId).single())
    const gm = must(
      await supabase.from('group_members').select('user_id, role, profiles(display_name)').eq('group_id', groupId),
    ) as unknown as { user_id: string; role: string; profiles: { display_name: string } | null }[]
    const ids = gm.map((m) => m.user_id)
    const since = localDay(addDays(new Date(), -29))
    const [sums, streaks] = await Promise.all([
      supabase.from('daily_summary').select('user_id, day, active_minutes, lessons_done, studied').in('user_id', ids).gte('day', since),
      supabase.from('streaks').select('user_id, current').in('user_id', ids),
    ])
    const sumRows = must(sums)
    const streakRows = must(streaks)
    const week = new Set(lastNDays(7))
    const today = localDay()

    const members: Member[] = gm.map((m) => {
      const days = new Map<string, DayStat>()
      let wk = 0
      for (const r of sumRows.filter((x) => x.user_id === m.user_id)) {
        days.set(r.day as string, { minutes: r.active_minutes, lessons: r.lessons_done, studied: r.studied })
        if (week.has(r.day as string)) wk += r.active_minutes as number
      }
      return {
        id: m.user_id,
        name: m.profiles?.display_name ?? 'Learner',
        role: m.role,
        current: streakRows.find((s) => s.user_id === m.user_id)?.current ?? 0,
        today: days.get(today),
        days,
        week: wk,
      }
    })
    members.sort((a, b) => b.week - a.week)
    return { id: g.id, name: g.name, inviteCode: g.invite_code, ownerId: g.owner_id, threshold: g.daily_threshold_min, members }
  }, [groupId])

  if (loading) return <div className="spinner">Loading…</div>
  if (error || !data) return <p className="error">{error || 'Group not found.'}</p>

  const isOwner = data.ownerId === uid
  const studiedCount = data.members.filter((m) => m.today?.studied).length
  const inviteLink = `${window.location.origin}/join/${data.inviteCode}`

  async function nudge(toUser: string) {
    const { error } = await supabase.from('nudges').insert({ from_user: uid, to_user: toUser, group_id: groupId })
    // 23505 = already nudged this person today: show it as sent.
    if (error && error.code !== '23505') setMsg(error.message)
    else setNudged((s) => new Set(s).add(toUser))
  }
  async function setThreshold(v: number) {
    const { error } = await supabase.from('groups').update({ daily_threshold_min: v }).eq('id', groupId)
    if (error) setMsg(error.message)
    else void reload()
  }
  async function leave() {
    if (!window.confirm('Leave this group?')) return
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', uid)
    if (error) setMsg(error.message)
    else navigate('/group')
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="row">
          <div className="grow">
            <h1>{data.name}</h1>
            <p className="muted">{data.members.length} member{data.members.length === 1 ? '' : 's'} · daily goal {data.threshold} min</p>
          </div>
          <button
            className="btn"
            onClick={() => {
              void navigator.clipboard.writeText(inviteLink)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? 'Link copied ✓' : 'Copy invite link'}
          </button>
        </div>
        <div style={{ marginTop: 14 }}>
          <b>{studiedCount} of {data.members.length} studied today</b>
          <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${(studiedCount / data.members.length) * 100}%` }} /></div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h2>This week</h2>
          <p className="muted">Ranked by study minutes in the last 7 days. Squares show the last 30 days.</p>
          <div className="list" style={{ marginTop: 12 }}>
            {data.members.map((m, i) => (
              <div className="item" key={m.id}>
                <div className="roster-item">
                  <div className="rank">{i + 1}</div>
                  <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <Flame state={flameState(m.today?.studied ?? false, m.current)} size={22} />
                    <div>
                      <b>{m.id === uid ? `${m.name} (you)` : m.name}</b>{' '}
                      <span className="muted">{m.current} day streak · {m.week} min this week</span>
                    </div>
                  </div>
                  <div className="row roster-actions">
                    <span className={`chip ${m.today?.studied ? 'yes' : 'no'}`}>
                      {m.today?.studied ? `Studied · ${m.today.minutes}m` : 'Not yet'}
                    </span>
                    {!m.today?.studied && m.id !== uid && (
                      <button className="btn secondary" disabled={nudged.has(m.id)} onClick={() => void nudge(m.id)}>
                        {nudged.has(m.id) ? 'Nudged ✓' : 'Nudge'}
                      </button>
                    )}
                    <Link to={`/group/${groupId}/member/${m.id}`} className="muted">Details</Link>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}><StripHeatmap days={m.days} /></div>
                <button className="btn ghost" style={{ marginTop: 4 }} onClick={() => toggleOpen(m.id)}>
                  {open.has(m.id) ? 'Hide streak map' : 'Show streak map'}
                </button>
                {open.has(m.id) && (
                  <div className="card" style={{ marginTop: 8, boxShadow: 'none' }}>
                    <MemberMap userId={m.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          {isOwner && (
            <div className="card">
              <h3>Daily goal (owner)</h3>
              <p className="muted">Active minutes that count a day as studied. Finishing a lesson or passing a quiz also counts.</p>
              <select value={data.threshold} onChange={(e) => void setThreshold(Number(e.target.value))}>
                {[5, 10, 15, 20, 30, 45, 60].map((n) => <option key={n} value={n}>{n} minutes</option>)}
              </select>
            </div>
          )}
          <div className="card">
            <h3>Invite code</h3>
            <p><code>{data.inviteCode}</code></p>
            <p className="muted">Anyone with this link can join. Share it only with people you trust.</p>
            {!isOwner && <button className="btn ghost" onClick={() => void leave()}>Leave group</button>}
          </div>
        </div>
      </div>
      {msg && <div className="error">{msg}</div>}
    </div>
  )
}
