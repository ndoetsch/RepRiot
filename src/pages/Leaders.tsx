import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Loading } from '../components/Loading'
import { TabBar } from '../components/TabBar'
import { useAuth } from '../lib/auth'
import { useCrew } from '../lib/crew'
import { addDays, shortDate, weekStart } from '../lib/dates'
import { daysLeft, pointsBetween } from '../lib/score'
import { useStats, type CrewStats } from '../lib/stats'
import { errorText, supabase } from '../lib/supabase'
import type { Challenge, Profile } from '../lib/types'

const DEFAULT_STAKES = "Winner's night out is paid by the others. Last place buys the first round."
const LENGTHS = [7, 14, 30]

function BadgeIcon({ earned }: { earned: boolean }) {
  return earned ? (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4v-5h4v-5h4V5h4" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function ChallengeCard({ c, stats, members, meId }: { c: Challenge; stats: CrewStats; members: Profile[]; meId: string }) {
  const today = stats.today
  const upTo = c.end_date < today ? c.end_date : today
  const started = c.start_date <= today
  const over = c.end_date < today
  const left = daysLeft(c.end_date, today)
  const status = !started ? `Starts ${shortDate(c.start_date)}` : over ? `Ended ${shortDate(c.end_date)}` : `${left} day${left === 1 ? '' : 's'} left`
  const nameOf = (id: string) => (id === meId ? 'You' : members.find((m) => m.id === id)?.display_name ?? 'Someone')

  let body
  if (c.kind === 'crew_goal') {
    const sets = started ? stats.logs.filter((l) => l.local_date >= c.start_date && l.local_date <= upTo).length : 0
    const goal = c.goal ?? 1
    const pct = Math.min(100, Math.round((sets / goal) * 100))
    body = (
      <>
        <div className="row between small" style={{ marginTop: 8 }}>
          <span>Crew sets together</span>
          <b>{sets} of {goal}</b>
        </div>
        <div className="pbar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={sets} aria-label={`${c.title} progress`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        {sets >= goal && <p className="small" style={{ margin: '8px 0 0', color: 'var(--primary)', fontWeight: 600 }}>Goal reached. Nice work, crew.</p>}
      </>
    )
  } else {
    const totals = started ? pointsBetween(stats.logs, stats.potluckSize, c.start_date, upTo) : new Map<string, number>()
    const ranked = members.map((m) => ({ m, pts: totals.get(m.id) ?? 0 })).sort((a, b) => b.pts - a.pts)
    body = (
      <ol style={{ listStyle: 'none', padding: 0, margin: '6px 0 0' }}>
        {ranked.map(({ m, pts }, i) => (
          <li key={m.id} className="row between small" style={{ padding: '4px 0' }}>
            <span>{i + 1}. {nameOf(m.id)}{over && i === 0 && pts > 0 ? ' 🏆' : ''}</span>
            <b>{pts} pts</b>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <article className="card">
      <div className="row between">
        <b>{c.title}</b>
        <span className="small muted">{status}</span>
      </div>
      <p className="small muted" style={{ margin: '2px 0 0' }}>
        {c.kind === 'crew_goal' ? 'Crew goal' : 'Most points wins'} · {shortDate(c.start_date)} to {shortDate(c.end_date)} · started by {nameOf(c.created_by)}
      </p>
      {body}
      {c.stakes && <div className="stakes"><b>Stakes:</b> {c.stakes}</div>}
    </article>
  )
}

function NewChallenge({ crewId, userId, today, onDone }: { crewId: string; userId: string; today: string; onDone: () => void }) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<Challenge['kind']>('points')
  const [goal, setGoal] = useState('200')
  const [length, setLength] = useState(7)
  const [stakes, setStakes] = useState(DEFAULT_STAKES)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const g = Number(goal)
    if (kind === 'crew_goal' && (!Number.isInteger(g) || g < 1)) return setError('Pick a goal of at least 1 set.')
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.from('challenges').insert({
      crew_id: crewId,
      created_by: userId,
      title: title.trim(),
      kind,
      goal: kind === 'crew_goal' ? g : null,
      start_date: today,
      end_date: addDays(today, length - 1),
      stakes: stakes.trim(),
    })
    setBusy(false)
    if (err) return setError(errorText(err))
    onDone()
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <b>New challenge</b>
      <div>
        <label htmlFor="ch-title">Name</label>
        <input id="ch-title" type="text" required maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="December Showdown" />
      </div>
      <div className="seg" role="group" aria-label="Challenge type">
        <button type="button" aria-pressed={kind === 'points'} onClick={() => { setKind('points'); if (!stakes) setStakes(DEFAULT_STAKES) }}>Most points</button>
        <button type="button" aria-pressed={kind === 'crew_goal'} onClick={() => { setKind('crew_goal'); if (stakes === DEFAULT_STAKES) setStakes('') }}>Crew goal</button>
      </div>
      {kind === 'crew_goal' && (
        <div>
          <label htmlFor="ch-goal">Sets the whole crew does together</label>
          <input id="ch-goal" type="number" inputMode="numeric" min={1} max={100000} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
      )}
      <div>
        <span className="label" id="ch-len">How long, starting today</span>
        <div className="chips" role="group" aria-labelledby="ch-len">
          {LENGTHS.map((n) => (
            <button key={n} type="button" className="chip" aria-pressed={length === n} onClick={() => setLength(n)}>{n} days</button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="ch-stakes">Stakes <span className="muted" style={{ fontWeight: 400 }}>(optional, settled in real life)</span></label>
        <textarea id="ch-stakes" maxLength={280} value={stakes} onChange={(e) => setStakes(e.target.value)} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy || !title.trim()}>{busy ? 'Starting…' : 'Start challenge'}</button>
    </form>
  )
}

export function Leaders() {
  const { crewId = '' } = useParams()
  const { profile } = useAuth()
  const { data, error: crewError } = useCrew(crewId)
  const { stats, error, reload } = useStats(crewId, profile?.id, data?.exercises.length)
  const [creating, setCreating] = useState(false)

  if (crewError) return <main className="screen"><p className="error">{crewError}</p></main>
  if (!data || !profile) return <Loading />

  const ranked = stats ? data.members.map((m) => ({ m, pts: stats.weekPoints.get(m.id) ?? 0 })).sort((a, b) => b.pts - a.pts) : []
  const resets = stats ? shortDate(addDays(weekStart(stats.today), 7)) : ''
  const earned = stats?.badges.filter((b) => b.earned).length ?? 0

  return (
    <>
      <main className="screen with-tabs">
        <div className="top"><h1 style={{ fontSize: 26 }}>Leaders</h1></div>
        {error && <p className="error" role="alert">{error}</p>}
        {!stats && !error && <div className="spinner" aria-label="Loading" />}

        {stats && (
          <>
            <section className="card" aria-labelledby="wk-h">
              <div className="row between">
                <h2 id="wk-h" style={{ fontSize: 16, margin: 0 }}>This week</h2>
                <span className="small muted">Resets Monday {resets}</span>
              </div>
              <ol style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
                {ranked.map(({ m, pts }, i) => (
                  <li key={m.id} className="lb-row">
                    <span className="rank">{i + 1}</span>
                    <Avatar profile={m} size={36} />
                    <span style={{ flex: 1, fontWeight: m.id === profile.id ? 700 : 500 }}>{m.id === profile.id ? 'You' : m.display_name}</span>
                    <b>{pts}</b>
                    <span className="small muted">pts</span>
                  </li>
                ))}
              </ol>
              <p className="small muted" style={{ margin: '8px 0 0' }}>10 points a set, plus 25 for doing every potluck exercise in a day.</p>
            </section>

            <div className="row between" style={{ margin: '20px 0 8px' }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Challenges</h2>
              {!creating && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreating(true)}>New challenge</button>}
            </div>
            <div className="stack">
              {creating && (
                <NewChallenge
                  crewId={crewId}
                  userId={profile.id}
                  today={stats.today}
                  onDone={() => {
                    setCreating(false)
                    void reload()
                  }}
                />
              )}
              {stats.challenges.map((c) => (
                <ChallengeCard key={c.id} c={c} stats={stats} members={data.members} meId={profile.id} />
              ))}
              {stats.challenges.length === 0 && !creating && (
                <p className="small muted" style={{ margin: 0 }}>No challenges yet. Start one, like a 30-day points race with real stakes.</p>
              )}
            </div>

            <div className="row between" style={{ margin: '20px 0 8px' }}>
              <h2 style={{ fontSize: 16, margin: 0 }}>Your badges</h2>
              <span className="small muted">{earned} of {stats.badges.length}</span>
            </div>
            <div className="card">
              <ul className="badges" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {stats.badges.map((b) => (
                  <li key={b.id} className={`badge ${b.earned ? '' : 'locked'}`}>
                    <span className="b"><BadgeIcon earned={b.earned} /></span>
                    {b.name}
                    <span className="how">{b.earned ? 'Earned' : b.how}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
      <TabBar crewId={crewId} />
    </>
  )
}
