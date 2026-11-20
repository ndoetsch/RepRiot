import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BRAND } from '../config/brand'
import { isOn } from '../config/features'
import { RULES } from '../config/rules'
import { useAuth } from '../lib/auth'
import { fetchMyCrews, type MyCrew } from '../lib/crew'
import { errorText, supabase } from '../lib/supabase'

type Kind = 'squad' | 'solo'

export function Crews() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [crews, setCrews] = useState<MyCrew[] | null>(null)
  const [kind, setKind] = useState<Kind>('squad')
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const [cap, setCap] = useState<number>(RULES.maxPrivateSquad)
  const [description, setDescription] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) fetchMyCrews(profile.id).then(setCrews).catch((e) => setError(errorText(e)))
  }, [profile])

  const maxCap = open ? RULES.maxPublicSquad : RULES.maxPrivateSquad

  function setPublic(on: boolean) {
    setOpen(on)
    setCap((c) => Math.min(c, on ? RULES.maxPublicSquad : RULES.maxPrivateSquad))
  }

  async function create(e: FormEvent) {
    e.preventDefault()
    const solo = kind === 'solo'
    const finalName = solo ? name.trim() || `${profile?.display_name ?? 'My'} solo run` : name.trim()
    if (!finalName) return
    setBusy(true)
    setError(null)
    const { data, error: err } = await supabase.rpc('create_squad', {
      p_name: finalName,
      p_solo: solo,
      p_public: !solo && open,
      p_max: solo ? 1 : cap,
      p_description: description.trim(),
    })
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
        <h1 style={{ fontSize: 26 }}>Your {BRAND.words.groups}</h1>
        <button type="button" className="link-btn" onClick={() => void signOut().then(() => navigate('/'))}>Sign out</button>
      </div>
      {crews === null && !error && <div className="spinner" aria-label="Loading" />}
      {crews && crews.length > 0 && (
        <div className="stack" style={{ marginBottom: 24 }}>
          {crews.map((c) => (
            <Link key={c.id} to={`/crew/${c.id}`} className="ex-row">
              <span className="name">{c.name}</span>
              <span className="small muted" style={{ marginLeft: 'auto' }}>
                {c.solo ? 'Solo' : `${c.is_public ? 'Public · ' : ''}${c.member_count} of ${c.max_members}`}
              </span>
            </Link>
          ))}
        </div>
      )}
      {crews && crews.length === 0 && (
        <p className="muted">Start a {BRAND.words.group} and invite up to {RULES.maxPrivateSquad - 1} friends, go solo, or join one with an invite link.</p>
      )}

      <form className="card stack" onSubmit={create} style={{ marginTop: 8 }}>
        <h2 style={{ fontSize: 18 }}>Start something</h2>
        {isOn('solo') && (
          <div className="seg" role="group" aria-label="Play with others or alone">
            <button type="button" aria-pressed={kind === 'squad'} onClick={() => setKind('squad')}>{BRAND.words.Group}</button>
            <button type="button" aria-pressed={kind === 'solo'} onClick={() => setKind('solo')}>Solo</button>
          </div>
        )}
        <div>
          <label htmlFor="crew-name">{kind === 'solo' ? 'Name your solo run (optional)' : `${BRAND.words.Group} name`}</label>
          <input id="crew-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={kind === 'solo' ? 'Me vs. the couch' : 'The Lunch Break Rebels'} />
        </div>
        {kind === 'solo' ? (
          <p className="small muted" style={{ margin: 0 }}>Just you. Bring up to {RULES.maxSoloMoves} moves and pick what's on screen while you do them.</p>
        ) : (
          <>
            {isOn('publicSquads') && (
              <div className="switch">
                <label htmlFor="crew-public">Public: anyone can find and join</label>
                <input id="crew-public" type="checkbox" checked={open} onChange={(e) => setPublic(e.target.checked)} />
              </div>
            )}
            <div>
              <span className="label" id="cap-l">Max people (including you)</span>
              <div className="counter" style={{ margin: '4px 0' }}>
                <button type="button" onClick={() => setCap((c) => Math.max(2, c - 1))} aria-label="Fewer people">−</button>
                <span className="big" aria-live="polite" aria-labelledby="cap-l">{cap}</span>
                <button type="button" onClick={() => setCap((c) => Math.min(maxCap, c + 1))} aria-label="More people">+</button>
              </div>
              <p className="small muted center" style={{ margin: 0 }}>
                {open ? `Public ${BRAND.words.groups} can have up to ${RULES.maxPublicSquad}.` : `Private, invite only. Up to ${RULES.maxPrivateSquad}.`}
              </p>
            </div>
            {open && (
              <div>
                <label htmlFor="crew-desc">What's it about? <span className="muted" style={{ fontWeight: 400 }}>(shown to strangers)</span></label>
                <input id="crew-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Desk workers who refuse to sit still" />
              </div>
            )}
          </>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy || (kind === 'squad' && !name.trim())}>
          {kind === 'solo' ? 'Go solo' : `Start ${BRAND.words.group}`}
        </button>
      </form>

      <form className="card stack" onSubmit={join} style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 18 }}>Join a {BRAND.words.group}</h2>
        <div>
          <label htmlFor="code">Invite link or code</label>
          <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste the link a friend sent you" />
        </div>
        <button className="btn btn-ghost" type="submit" disabled={!code.trim()}>Join</button>
        {isOn('publicSquads') && <Link to="/discover" className="btn btn-ghost">Browse public {BRAND.words.groups}</Link>}
      </form>
      <Link to="/setup" className="link-btn center" style={{ marginTop: 16 }}>Edit my profile</Link>
    </main>
  )
}
