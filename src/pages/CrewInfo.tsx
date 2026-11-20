import { InstallCard, ShareAppButton } from '../components/InstallApp'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Loading } from '../components/Loading'
import { Reminders } from '../components/Reminders'
import { TabBar } from '../components/TabBar'
import { useAuth } from '../lib/auth'
import { inviteLink, useCrew } from '../lib/crew'
import { exerciseLabel } from '../lib/format'
import { SquadSettings } from '../components/SquadSettings'
import { BRAND } from '../config/brand'
import { isOn } from '../config/features'
import { RULES } from '../config/rules'

export function CrewInfo() {
  const { crewId = '' } = useParams()
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { data, error, reload } = useCrew(crewId)
  const [copied, setCopied] = useState(false)

  if (error) return <main className="screen"><p className="error">{error}</p></main>
  if (!data || !profile) return <Loading />

  const { crew, members, exercises } = data
  const link = inviteLink(crew.invite_code)
  const spots = crew.max_members - members.length
  const organizer = crew.created_by === profile.id

  async function share() {
    const text = `Join my ${BRAND.name} ${BRAND.words.group} "${crew.name}". Quick moves all day, and way more fun than it should be.`
    if (navigator.share) {
      try {
        await navigator.share({ title: BRAND.name, text, url: link })
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

        {crew.solo ? (
          <div className="card">
            <b>Solo run</b>
            <p className="small muted" style={{ margin: '4px 0 0' }}>Just you, up to {RULES.maxSoloMoves} moves. Want company? Start a {BRAND.words.group} from the {BRAND.words.groups} page.</p>
          </div>
        ) : (
        <div className="card stack">
          <div className="row between">
            <b>Invite friends</b>
            <span className="small muted">{crew.is_public ? 'Public · ' : 'Private · '}{members.length} of {crew.max_members}</span>
          </div>
          {spots > 0 ? (
            <>
              <p className="small muted" style={{ margin: 0 }}>{spots} spot{spots === 1 ? '' : 's'} left. Send this link:</p>
              <p className="small" style={{ margin: 0, wordBreak: 'break-all' }}>{link}</p>
              <button type="button" className="btn btn-primary" onClick={share}>{copied ? 'Link copied' : 'Share invite link'}</button>
            </>
          ) : (
            <p className="small muted" style={{ margin: 0 }}>This {BRAND.words.group} is full.</p>
          )}
        </div>
        )}

        {organizer && !crew.solo && isOn('publicSquads') && <SquadSettings crew={crew} memberCount={members.length} onSaved={reload} />}

        <h2 style={{ fontSize: 18, margin: '20px 0 10px' }}>The {BRAND.words.lineup}</h2>
        <div className="stack">
          {members.map((m) => {
            const mine = exercises.filter((e) => e.user_id === m.id)
            const ex = mine[0]
            const showBio = m.id === profile.id || m.bio_public
            return (
              <div key={m.id} className="card row" style={{ alignItems: 'flex-start' }}>
                <Avatar profile={m} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{m.id === profile.id ? `${m.display_name} (you)` : m.display_name}</b>
                  <div className="small">{ex ? `Brings ${mine.map(exerciseLabel).join(', ')}` : 'Has not brought a move yet'}</div>
                  {showBio && m.bio && <div className="small muted" style={{ marginTop: 4 }}>{m.bio}</div>}
                </div>
                {m.id === profile.id && (
                  <Link to={`/crew/${crewId}/bring`} className="link-btn small" style={{ minHeight: 0 }}>{crew.solo ? 'Edit' : ex ? 'Swap' : 'Bring'}</Link>
                )}
              </div>
            )
          })}
        </div>

        {isOn('reminders') && (
          <div style={{ marginTop: 24 }}>
            <Reminders userId={profile.id} />
          </div>
        )}

        <InstallCard style={{ marginTop: 24 }} />

        <div className="stack" style={{ marginTop: 24 }}>
          <ShareAppButton />
          <Link to="/crews" className="btn btn-ghost">{`Switch or start a ${BRAND.words.group}`}</Link>
          <Link to="/setup" className="btn btn-ghost">Edit my profile</Link>
          <button type="button" className="link-btn" onClick={() => void signOut().then(() => navigate('/'))}>Sign out</button>
        </div>
      </main>
      <TabBar crewId={crewId} />
    </>
  )
}
