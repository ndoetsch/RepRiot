import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Loading } from '../components/Loading'
import { pendingInvite, useAuth } from '../lib/auth'
import { lastCrew } from '../lib/crew'
import { errorText, supabase } from '../lib/supabase'
import { MAX_CREW } from '../lib/types'

type Preview = { id: string; name: string; member_count: number; member_names: string[] }

export function Join() {
  const { code = '' } = useParams()
  const { loading, session, profile } = useAuth()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<Preview | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    pendingInvite.set(code)
  }, [code])

  useEffect(() => {
    if (!session) return
    supabase.rpc('crew_preview', { p_code: code }).then(async ({ data, error: err }) => {
      if (err) setError(errorText(err))
      const p = ((data as Preview[] | null) ?? [])[0] ?? null
      if (p) {
        const { count } = await supabase.from('crew_members').select('*', { count: 'exact', head: true }).eq('crew_id', p.id).eq('user_id', session.user.id)
        if (count) {
          pendingInvite.clear()
          lastCrew.set(p.id)
          navigate(`/crew/${p.id}`, { replace: true })
          return
        }
      }
      setPreview(p)
    })
  }, [session, code, navigate])

  if (loading) return <Loading />

  if (!session) {
    return (
      <main className="screen center">
        <div style={{ margin: '36px auto 12px' }}><Logo width={88} /></div>
        <h1 style={{ fontSize: 26 }}>You're invited to a Fitluck crew</h1>
        <p className="muted">Sign in or create an account and you'll join right after.</p>
        <Link to="/" className="btn btn-primary push">Get started</Link>
      </main>
    )
  }
  if (!profile?.onboarded) {
    navigate('/setup', { replace: true })
    return null
  }
  if (preview === undefined) return <Loading />

  async function join() {
    setBusy(true)
    const { data, error: err } = await supabase.rpc('join_crew', { p_code: code })
    setBusy(false)
    if (err) return setError(errorText(err))
    pendingInvite.clear()
    const crewId = data as string
    lastCrew.set(crewId)
    navigate(`/crew/${crewId}/bring`, { replace: true })
  }

  if (!preview) {
    pendingInvite.clear()
    return (
      <main className="screen">
        <h1 style={{ fontSize: 24 }}>That invite link doesn't work</h1>
        <p className="muted">Ask your friend to send it again, or start your own crew.</p>
        <Link to="/crews" className="btn btn-primary push">Go to my crews</Link>
      </main>
    )
  }

  const full = preview.member_count >= MAX_CREW
  return (
    <main className="screen">
      <span className="eyebrow">Join your crew</span>
      <div className="card stack" style={{ marginTop: 12 }}>
        <h1 style={{ fontSize: 22 }}>{preview.name}</h1>
        <p className="muted small" style={{ margin: 0 }}>{preview.member_count} of {MAX_CREW} spots taken</p>
        <p style={{ margin: 0 }}>{preview.member_names.join(', ')}</p>
      </div>
      <p className="small muted">You can be in more than one crew. Each crew has its own potluck.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="stack push">
        <button type="button" className="btn btn-primary" onClick={join} disabled={busy || full}>
          {full ? 'This crew is full' : busy ? 'Joining…' : `Join ${preview.name}`}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => { pendingInvite.clear(); navigate('/crews') }}>Not now</button>
      </div>
    </main>
  )
}
