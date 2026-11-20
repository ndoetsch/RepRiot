import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Back } from '../components/Back'
import { BRAND } from '../config/brand'
import { lastCrew } from '../lib/crew'
import { errorText, supabase } from '../lib/supabase'

type PublicSquad = { id: string; name: string; description: string; member_count: number; max_members: number }

/** Public squads anyone can join, biggest first. */
export function Discover() {
  const navigate = useNavigate()
  const [squads, setSquads] = useState<PublicSquad[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    supabase.rpc('public_squads').then(({ data, error: err }) => {
      if (err) setError(errorText(err))
      setSquads((data ?? []) as PublicSquad[])
    })
  }, [])

  async function join(id: string) {
    setBusy(id)
    setError(null)
    const { error: err } = await supabase.rpc('join_public_squad', { p_crew: id })
    setBusy(null)
    if (err) return setError(errorText(err))
    lastCrew.set(id)
    navigate(`/crew/${id}/bring`)
  }

  return (
    <main className="screen">
      <div className="top"><Back to="/crews" /><h1 style={{ fontSize: 22 }}>Public {BRAND.words.groups}</h1><span style={{ width: 44 }} /></div>
      <p className="muted small" style={{ marginTop: 0 }}>Jump in with strangers who also refuse to be boring.</p>
      {error && <p className="error" role="alert">{error}</p>}
      {squads === null && <div className="spinner" aria-label="Loading" />}
      {squads && squads.length === 0 && <p className="muted">No public {BRAND.words.groups} yet. Start one and make it public.</p>}
      <div className="stack">
        {squads?.map((s) => {
          const full = s.member_count >= s.max_members
          return (
            <div key={s.id} className="card stack" style={{ gap: 6 }}>
              <div className="row between">
                <b>{s.name}</b>
                <span className="small muted">{s.member_count} of {s.max_members}</span>
              </div>
              {s.description && <p className="small muted" style={{ margin: 0 }}>{s.description}</p>}
              <button type="button" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={full || busy === s.id} onClick={() => join(s.id)}>
                {full ? 'Full' : busy === s.id ? 'Joining…' : 'Join'}
              </button>
            </div>
          )
        })}
      </div>
    </main>
  )
}
