import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { fetchMyCrews, type MyCrew } from '../lib/crew'
import { errorText, supabase } from '../lib/supabase'
import { MAX_CREW } from '../lib/types'

export function Crews() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [crews, setCrews] = useState<MyCrew[] | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) fetchMyCrews(profile.id).then(setCrews).catch((e) => setError(errorText(e)))
  }, [profile])

  async function create(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const { data, error: err } = await supabase.rpc('create_crew', { p_name: name.trim() })
    setBusy(false)
    if (err) return setError(errorText(err))
    navigate(`/crew/${(data as { id: string }).id}/bring`)
  }

  function join(e: FormEvent) {
    e.preventDefault()
    const c = code.trim().split('/').pop()
    if (c) navigate(`/join/${c}`)
  }

  return (
    <main className="screen">
      <div className="top">
        <h1 style={{ fontSize: 26 }}>Your crews</h1>
        <button type="button" className="link-btn" onClick={() => void signOut().then(() => navigate('/'))}>Sign out</button>
      </div>
      {crews === null && !error && <div className="spinner" aria-label="Loading" />}
      {crews && crews.length > 0 && (
        <div className="stack" style={{ marginBottom: 24 }}>
          {crews.map((c) => (
            <Link key={c.id} to={`/crew/${c.id}`} className="ex-row">
              <span className="name">{c.name}</span>
              <span className="small muted" style={{ marginLeft: 'auto' }}>{c.member_count} of {MAX_CREW}</span>
            </Link>
          ))}
        </div>
      )}
      {crews && crews.length === 0 && <p className="muted">You're not in a crew yet. Start one and invite up to 4 friends, or join with an invite link.</p>}

      <form className="card stack" onSubmit={create} style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 18 }}>Start a crew</h2>
        <div>
          <label htmlFor="crew-name">Crew name</label>
          <input id="crew-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="The Lunch Break Crew" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy || !name.trim()}>Start crew</button>
      </form>

      <form className="card stack" onSubmit={join} style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 18 }}>Join a crew</h2>
        <div>
          <label htmlFor="code">Invite link or code</label>
          <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the link a friend sent you" />
        </div>
        <button className="btn btn-ghost" type="submit" disabled={!code.trim()}>Join</button>
      </form>
      {error && <p className="error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
      <Link to="/setup" className="link-btn center" style={{ marginTop: 16 }}>Edit my profile</Link>
    </main>
  )
}
