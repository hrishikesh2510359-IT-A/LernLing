import { useEffect, useState } from 'react'
import { useAuth, useUserId } from '../lib/auth'
import { useAsync } from '../lib/hooks'
import { must } from '../lib/query'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const uid = useUserId()
  const { signOut } = useAuth()
  const { data, loading, error } = useAsync(async () => {
    return must(
      await supabase.from('profiles').select('display_name, timezone, share_course_names').eq('id', uid).single(),
    )
  }, [uid])

  const [name, setName] = useState('')
  const [tz, setTz] = useState('UTC')
  const [share, setShare] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (data) {
      setName(data.display_name)
      setTz(data.timezone)
      setShare(data.share_course_names)
    }
  }, [data])

  if (loading) return <div className="spinner">Loading…</div>
  if (error) return <p className="error">{error}</p>

  const zones: string[] = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? [tz]

  async function save() {
    setMsg('')
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name.trim() || 'Learner', timezone: tz, share_course_names: share })
      .eq('id', uid)
    setMsg(error ? error.message : 'Saved ✓')
  }

  async function deleteAccount() {
    if (!window.confirm('Delete your account and ALL your study data? This cannot be undone.')) return
    const { error } = await supabase.rpc('delete_my_account')
    if (error) return setMsg(error.message)
    await signOut()
  }

  return (
    <div className="grid" style={{ maxWidth: 560 }}>
      <h1>Settings</h1>
      <div className="card">
        <div className="field">
          <label htmlFor="n">Display name</label>
          <input id="n" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="tz">Timezone</label>
          <select id="tz" value={tz} onChange={(e) => setTz(e.target.value)}>
            {(zones.includes(tz) ? zones : [tz, ...zones]).map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <span className="muted">Decides where your day starts and ends for streaks.</span>
        </div>
        <label className="row" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
          <span>Show my course names to the group owner</span>
        </label>
        <button className="btn" onClick={() => void save()}>Save</button>
        {msg && <p className="muted">{msg}</p>}
      </div>

      <div className="card">
        <h3>Delete my data</h3>
        <p className="muted">Removes your account, streaks, activity and group memberships for good.</p>
        <button className="btn danger" onClick={() => void deleteAccount()}>Delete my account</button>
      </div>
    </div>
  )
}
