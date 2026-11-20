import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Loading } from '../components/Loading'
import { Reminders } from '../components/Reminders'
import { TabBar } from '../components/TabBar'
import { useAuth } from '../lib/auth'
import { inviteLink, useCrew } from '../lib/crew'
import { exerciseLabel } from '../lib/format'
import { MAX_CREW } from '../lib/types'

export function CrewInfo() {
  const { crewId = '' } = useParams()
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { data, error } = useCrew(crewId)
  const [copied, setCopied] = useState(false)

  if (error) return <main className="screen"><p className="error">{error}</p></main>
  if (!data || !profile) return <Loading />

  const { crew, members, exercises } = data
  const link = inviteLink(crew.invite_code)
  const spots = MAX_CREW - members.length

  async function share() {
    const text = `Join my Fitluck crew "${crew.name}". Everyone brings one quick exercise and we all do them together.`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Fitluck', text, url: link })
        return
      } catch {
        /* person closed the share sheet; fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* the link is shown on screen to copy by hand */
    }
  }

  return (
    <>
      <main className="screen with-tabs">
        <div className="top"><h1 style={{ fontSize: 26 }}>{crew.name}</h1></div>

        <div className="card stack">
          <div className="row between">
            <b>Invite friends</b>
            <span className="small muted">{members.length} of {MAX_CREW}</span>
          </div>
          {spots > 0 ? (
            <>
              <p className="small muted" style={{ margin: 0 }}>{spots} spot{spots === 1 ? '' : 's'} left. Send this link:</p>
              <p className="small" style={{ margin: 0, wordBreak: 'break-all' }}>{link}</p>
              <button type="button" className="btn btn-primary" onClick={share}>{copied ? 'Link copied' : 'Share invite link'}</button>
            </>
          ) : (
            <p className="small muted" style={{ margin: 0 }}>This crew is full.</p>
          )}
        </div>

        <h2 style={{ fontSize: 18, margin: '20px 0 10px' }}>The potluck</h2>
        <div className="stack">
          {members.map((m) => {
            const ex = exercises.find((e) => e.user_id === m.id)
            const showBio = m.id === profile.id || m.bio_public
            return (
              <div key={m.id} className="card row" style={{ alignItems: 'flex-start' }}>
                <Avatar profile={m} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{m.id === profile.id ? `${m.display_name} (you)` : m.display_name}</b>
                  <div className="small">{ex ? `Brings ${exerciseLabel(ex)}` : 'Has not brought an exercise yet'}</div>
                  {showBio && m.bio && <div className="small muted" style={{ marginTop: 4 }}>{m.bio}</div>}
                </div>
                {m.id === profile.id && (
                  <Link to={`/crew/${crewId}/bring`} className="link-btn small" style={{ minHeight: 0 }}>{ex ? 'Swap' : 'Bring'}</Link>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 24 }}>
          <Reminders userId={profile.id} />
        </div>

        <div className="stack" style={{ marginTop: 24 }}>
          <Link to="/crews" className="btn btn-ghost">Switch or start a crew</Link>
          <Link to="/setup" className="btn btn-ghost">Edit my profile</Link>
          <button type="button" className="link-btn" onClick={() => void signOut().then(() => navigate('/'))}>Sign out</button>
        </div>
      </main>
      <TabBar crewId={crewId} />
    </>
  )
}
