import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ClimbCard } from '../components/ClimbCard'
import { Loading } from '../components/Loading'
import { TabBar } from '../components/TabBar'
import { useAuth } from '../lib/auth'
import { lastCrew, useCrew } from '../lib/crew'
import { useStats } from '../lib/stats'
import { weekdayName } from '../lib/dates'
import { exerciseLabel } from '../lib/format'
import { MAX_CREW, SETS_PER_DAY } from '../lib/types'

export function Today() {
  const { crewId = '' } = useParams()
  const { profile } = useAuth()
  const { data, error } = useCrew(crewId)
  const { stats } = useStats(crewId, profile?.id, data?.exercises.length)

  useEffect(() => {
    if (data) lastCrew.set(crewId)
  }, [data, crewId])

  if (error) return <main className="screen"><p className="error">{error}</p><Link to="/crews">Back to my crews</Link></main>
  if (!data || !profile) return <Loading />

  const { crew, members, exercises, todayLogs } = data
  const myLogs = todayLogs.filter((l) => l.user_id === profile.id)
  const doneFor = (exerciseId: string) => myLogs.filter((l) => l.exercise_id === exerciseId).length
  const total = exercises.length * SETS_PER_DAY
  const done = myLogs.length
  const iBrought = exercises.some((e) => e.user_id === profile.id)
  const movedToday = new Set(todayLogs.map((l) => l.user_id))
  const nameOf = (id: string) => (id === profile.id ? 'you' : members.find((m) => m.id === id)?.display_name ?? 'someone')

  return (
    <>
      <main className="screen with-tabs">
        <div className="top" style={{ marginBottom: 8 }}>
          <div>
            <span className="eyebrow">{weekdayName()}</span>
            <h1 style={{ fontSize: 26 }}>Today</h1>
          </div>
          <Link to="/crews" className="btn btn-ghost btn-sm" aria-label={`Crew: ${crew.name}. Switch crew`}>
            {crew.name}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </Link>
        </div>

        {stats && <ClimbCard stats={stats} myPointsThisWeek={stats.weekPoints.get(profile.id) ?? 0} />}

        <div className="card" style={{ marginTop: 12 }}>
          <div className="row between">
            <b>Your sets today</b>
            <span className="small muted">{done} of {total}</span>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: 'var(--line)', overflow: 'hidden', marginTop: 10 }} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Sets done today">
            <div style={{ height: '100%', width: `${total ? (done / total) * 100 : 0}%`, background: 'var(--primary)', transition: 'width .3s' }} />
          </div>
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            {total === 0 ? 'No exercises on the table yet.' : done >= total ? 'Every potluck exercise done today. Legend.' : `About ${Math.max(1, total - done)} minutes of moving left.`}
          </p>
        </div>

        {!iBrought && (
          <Link to={`/crew/${crewId}/bring`} className="card" style={{ marginTop: 12, display: 'block', textDecoration: 'none', color: 'inherit', borderColor: 'var(--primary)', background: 'var(--primary-soft)' }}>
            <b>Bring your exercise</b>
            <p className="small" style={{ margin: '4px 0 0' }}>Pick one exercise and its GIF for the crew. Tap to start.</p>
          </Link>
        )}

        <h2 style={{ fontSize: 15, margin: '18px 0 8px' }}>Who's moving today</h2>
        <div className="strip">
          {members.map((m) => (
            <div key={m.id} className="member">
              <span className={`ring ${movedToday.has(m.id) ? 'done' : ''}`}><Avatar profile={m} /></span>
              <span className="name">{m.id === profile.id ? 'You' : m.display_name}</span>
              <span className="sr-only">{movedToday.has(m.id) ? 'has moved today' : 'has not moved yet today'}</span>
            </div>
          ))}
          {members.length < MAX_CREW && (
            <Link to={`/crew/${crewId}/crew`} className="member" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="ring"><span className="open-spot">+</span></span>
              <span className="name">Invite</span>
            </Link>
          )}
        </div>

        <h2 style={{ fontSize: 15, margin: '16px 0 8px' }}>Your potluck</h2>
        <div className="stack">
          {exercises.map((e) => {
            const d = doneFor(e.id)
            const owner = members.find((m) => m.id === e.user_id)
            const finished = d >= SETS_PER_DAY
            const inner = (
              <>
                {owner && <Avatar profile={owner} />}
                <span>
                  <span className="name">{exerciseLabel(e)}</span>
                  <br />
                  <span className="small muted">brought by {nameOf(e.user_id)}</span>
                </span>
                <span className="dots" aria-label={`${d} of ${SETS_PER_DAY} sets done`}>
                  {Array.from({ length: SETS_PER_DAY }, (_, i) => <span key={i} className={`dot ${i < d ? 'on' : ''}`} />)}
                </span>
              </>
            )
            return finished ? (
              <div key={e.id} className="ex-row" aria-disabled="true">{inner}</div>
            ) : (
              <Link key={e.id} to={`/crew/${crewId}/do/${e.id}`} className="ex-row">{inner}</Link>
            )
          })}
          {exercises.length === 0 && <p className="muted small">Once people bring their exercises, they show up here.</p>}
        </div>
      </main>
      <TabBar crewId={crewId} />
    </>
  )
}
