import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Mascot } from '../components/Mascot'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/hooks'
import { EXTENSION_URL, supabase } from '../lib/supabase'

interface Preview {
  name: string
  owner_name: string
  member_count: number
}

const PENDING_KEY = 'lernling.pendingJoin'

export default function Join() {
  const { code = '' } = useParams()
  const { session, loading: authLoading, signIn } = useAuth()
  const [joined, setJoined] = useState<string | null>(null)
  const [err, setErr] = useState('')

  const preview = useAsync(async () => {
    const { data, error } = await supabase.rpc('group_preview', { code })
    if (error) throw new Error(error.message)
    return (data as Preview | null) ?? null
  }, [code])

  async function join() {
    setErr('')
    const { data, error } = await supabase.rpc('join_group', { code })
    if (error) return setErr(error.message)
    try { localStorage.removeItem(PENDING_KEY) } catch { /* ignore */ }
    setJoined(data as string)
  }

  // After the Google round trip, finish joining automatically (they already chose to sign in here).
  useEffect(() => {
    if (!session || joined || !preview.data) return
    let pending = ''
    try { pending = localStorage.getItem(PENDING_KEY) ?? '' } catch { /* ignore */ }
    if (pending === code) void join()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, preview.data])

  if (preview.loading || authLoading) return <div className="spinner">Loading…</div>

  if (preview.error) {
    return (
      <div className="centered">
        <div className="card narrow center">
          <h2>Couldn't load this invite</h2>
          <p className="error">{preview.error}</p>
          <p className="muted">Check your connection and try again.</p>
        </div>
      </div>
    )
  }

  if (!preview.data) {
    return (
      <div className="centered">
        <div className="card narrow center">
          <Mascot stage={0} mood="sad" size={100} />
          <h2>This invite link isn't valid</h2>
          <p className="muted">Ask your friend for a fresh link.</p>
          <Link to="/" className="btn">Go to Lernling</Link>
        </div>
      </div>
    )
  }
  const g = preview.data

  return (
    <div className="centered">
      <div className="card narrow">
        <div className="center">
          <Mascot stage={1} mood="celebrating" size={110} />
          <h1>{g.owner_name} invited you to {g.name}</h1>
          <p className="muted">{g.member_count} member{g.member_count === 1 ? '' : 's'} are keeping each other's study streaks alive.</p>
        </div>

        {joined ? (
          <div className="center" style={{ marginTop: 16 }}>
            <h2>You're in! 🎉</h2>
            <p className="muted">Open Udemy or Coursera with the Lernling extension installed and start learning.</p>
            <Link to={`/group/${joined}`} className="btn">Open my group</Link>
          </div>
        ) : (
          <div className="list" style={{ marginTop: 18 }}>
            <div className="step">
              <div className="n">1</div>
              <div>
                <h3>Install the Chrome extension</h3>
                <p className="muted">It counts the time you actually study on learning sites. Visiting a page alone never counts.</p>
                {EXTENSION_URL ? (
                  <a className="btn" href={EXTENSION_URL} target="_blank" rel="noreferrer">Add to Chrome</a>
                ) : (
                  <div className="notice">The Chrome Web Store link isn't ready yet. Ask {g.owner_name} how to install it.</div>
                )}
              </div>
            </div>
            <div className="step">
              <div className="n">2</div>
              <div>
                <h3>{session ? `Join ${g.name}` : 'Sign in to join'}</h3>
                {session ? (
                  <button className="btn" onClick={() => void join()}>Join {g.name}</button>
                ) : (
                  <button
                    className="btn"
                    onClick={() => {
                      try { localStorage.setItem(PENDING_KEY, code) } catch { /* ignore */ }
                      void signIn(`/join/${code}`)
                    }}
                  >
                    Sign in with Google
                  </button>
                )}
                {err && <div className="error">{err}</div>}
              </div>
            </div>
            <div className="notice">
              <b>Privacy:</b> the group can see your study minutes, streak and course names. You can hide course names in
              Settings. We never record your browsing history or page content.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
