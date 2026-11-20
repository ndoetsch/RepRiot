import { useState } from 'react'
import { BRAND } from '../../config/brand'
import { setsBetween, takingPart, tally, type ChallengeExtras } from '../../lib/challenges'
import { shortDate } from '../../lib/dates'
import { daysLeft, pointsBetween } from '../../lib/score'
import type { CrewStats } from '../../lib/stats'
import { errorText, supabase } from '../../lib/supabase'
import type { Challenge, Profile } from '../../lib/types'
import { Debate } from './Debate'
import { ChallengeForm } from './NewChallenge'

type CardProps = {
  c: Challenge
  stats: CrewStats
  members: Profile[]
  meId: string
  extras: ChallengeExtras
  onChange: () => void
}

function timing(c: Challenge, today: string) {
  const started = c.start_date <= today
  const over = c.end_date < today
  const left = daysLeft(c.end_date, today)
  const label = !started ? `Starts ${shortDate(c.start_date)}` : over ? `Ended ${shortDate(c.end_date)}` : `${left} day${left === 1 ? '' : 's'} left`
  return { started, over, label, upTo: c.end_date < today ? c.end_date : today }
}

function useNames(members: Profile[], meId: string) {
  return (id: string) => (id === meId ? 'You' : members.find((m) => m.id === id)?.display_name ?? 'Someone')
}

/** Per-person progress toward "N sets each", used by gauntlets and dares. */
function EachProgress({ c, stats, people, nameOf }: { c: Challenge; stats: CrewStats; people: string[]; nameOf: (id: string) => string }) {
  const { started, over, upTo } = timing(c, stats.today)
  const goal = c.goal ?? 1
  const sets = started ? setsBetween(stats.logs, c.start_date, upTo) : new Map<string, number>()
  const rows = people.map((id) => ({ id, n: sets.get(id) ?? 0 })).sort((a, b) => b.n - a.n)
  return (
    <ul className="progress-list">
      {rows.map(({ id, n }) => {
        const done = n >= goal
        return (
          <li key={id}>
            <div className="row between small">
              <span>{nameOf(id)}{done ? ' ✅' : over ? ' ❌' : ''}</span>
              <b>{Math.min(n, goal)} / {goal}</b>
            </div>
            <div className="pbar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(n, goal)} aria-label={`${nameOf(id)} progress`}>
              <span style={{ width: `${Math.min(100, (n / goal) * 100)}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function GauntletCard({ c, stats, members, meId, extras, onChange }: CardProps) {
  const nameOf = useNames(members, meId)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const votes = extras.votes.filter((v) => v.challenge_id === c.id)
  const t = tally(votes, members.length)
  const myVote = votes.find((v) => v.user_id === meId)?.vote
  const comments = extras.comments.filter((x) => x.challenge_id === c.id)

  async function vote(yes: boolean) {
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.rpc('vote_gauntlet', { p_challenge: c.id, p_vote: yes, p_today: stats.today })
    setBusy(false)
    if (err) return setError(errorText(err))
    onChange()
  }

  const terms = `${c.goal} sets each in ${c.length_days} day${c.length_days === 1 ? '' : 's'}`

  if (c.status === 'voting') {
    if (editing) {
      return <ChallengeForm crewId={c.crew_id} userId={meId} today={stats.today} solo={false} editing={c} onDone={() => { setEditing(false); onChange() }} onCancel={() => setEditing(false)} />
    }
    return (
      <article className="card challenge gauntlet">
        <div className="row between">
          <span className="pill pill-hot">⚔️ Gauntlet · up for a vote</span>
        </div>
        <b className="challenge-title">{c.title}</b>
        <p className="small" style={{ margin: '2px 0 0' }}>{terms} · proposed by {nameOf(c.created_by)}</p>
        {c.details && <p className="small muted" style={{ margin: '6px 0 0' }}>{c.details}</p>}
        {c.stakes && <div className="stakes"><b>Stakes:</b> {c.stakes}</div>}
        <div className="vote-bar" aria-label={`${t.yes} yes, ${t.no} no, ${t.needed} yes votes needed`}>
          <span>👍 {t.yes}</span>
          <span className="muted small">{t.needed} yes to start · {members.length - votes.length} still to vote</span>
          <span>👎 {t.no}</span>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }} aria-pressed={myVote === true} disabled={busy} onClick={() => vote(true)}>{myVote === true ? "You're in" : "I'm in"}</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} aria-pressed={myVote === false} disabled={busy} onClick={() => vote(false)}>{myVote === false ? 'You said no' : 'Not like this'}</button>
        </div>
        {c.created_by === meId && <button type="button" className="link-btn small" onClick={() => setEditing(true)}>Change the terms (resets votes)</button>}
        {error && <p className="error" role="alert">{error}</p>}
        <Debate challengeId={c.id} comments={comments} members={members} meId={meId} prompt="Argue for a change…" onPosted={onChange} />
      </article>
    )
  }

  if (c.status === 'rejected') {
    return (
      <article className="card challenge" style={{ opacity: 0.7 }}>
        <span className="pill">⚔️ Gauntlet · voted down</span>
        <b className="challenge-title">{c.title}</b>
        <p className="small muted" style={{ margin: '2px 0 0' }}>{terms}. The {BRAND.words.group} said no. Propose a new version?</p>
      </article>
    )
  }

  const { label } = timing(c, stats.today)
  return (
    <article className="card challenge gauntlet">
      <div className="row between">
        <span className="pill pill-hot">⚔️ Gauntlet · everyone's in</span>
        <span className="small muted">{label}</span>
      </div>
      <b className="challenge-title">{c.title}</b>
      <p className="small muted" style={{ margin: '2px 0 0' }}>{terms} · {shortDate(c.start_date)} to {shortDate(c.end_date)}</p>
      <EachProgress c={c} stats={stats} people={members.map((m) => m.id)} nameOf={nameOf} />
      {c.stakes && <div className="stakes"><b>Stakes:</b> {c.stakes}</div>}
      <Debate challengeId={c.id} comments={comments} members={members} meId={meId} prompt="Trash talk welcome…" onPosted={onChange} />
    </article>
  )
}

export function DareCard({ c, stats, members, meId, extras, onChange }: CardProps) {
  const nameOf = useNames(members, meId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const people = takingPart(c, members.map((m) => m.id), extras.participants)
  const inIt = people.includes(meId)
  const comments = extras.comments.filter((x) => x.challenge_id === c.id)
  const { over, label } = timing(c, stats.today)
  const solo = members.length === 1

  async function toggle() {
    setBusy(true)
    setError(null)
    const q = inIt
      ? supabase.from('challenge_participants').delete().eq('challenge_id', c.id).eq('user_id', meId)
      : supabase.from('challenge_participants').insert({ challenge_id: c.id, user_id: meId })
    const { error: err } = await q
    setBusy(false)
    if (err) return setError(errorText(err))
    onChange()
  }

  return (
    <article className="card challenge dare">
      <div className="row between">
        <span className="pill pill-cool">{solo ? '🎯 Personal challenge' : `🎲 Open dare · ${people.length} in`}</span>
        <span className="small muted">{label}</span>
      </div>
      <b className="challenge-title">{c.title}</b>
      <p className="small muted" style={{ margin: '2px 0 0' }}>
        {c.goal} sets each · {shortDate(c.start_date)} to {shortDate(c.end_date)}{solo ? '' : ` · thrown down by ${nameOf(c.created_by)}`}
      </p>
      {c.details && <p className="small" style={{ margin: '6px 0 0' }}>{c.details}</p>}
      {people.length > 0 && <EachProgress c={c} stats={stats} people={people} nameOf={nameOf} />}
      {c.stakes && <div className="stakes"><b>Stakes:</b> {c.stakes}</div>}
      {!over && !solo && (
        <button type="button" className={`btn btn-sm ${inIt ? 'btn-ghost' : 'btn-primary'}`} style={{ marginTop: 10 }} disabled={busy} onClick={toggle}>
          {inIt ? 'Back out' : 'Take the dare'}
        </button>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {!solo && <Debate challengeId={c.id} comments={comments} members={members} meId={meId} prompt="Say something…" onPosted={onChange} />}
    </article>
  )
}

/** Points races and squad goals, carried over from Fitluck. */
export function ClassicCard({ c, stats, members, meId }: CardProps) {
  const nameOf = useNames(members, meId)
  const { started, over, upTo, label } = timing(c, stats.today)

  let body
  if (c.kind === 'crew_goal') {
    const sets = started ? stats.logs.filter((l) => l.local_date >= c.start_date && l.local_date <= upTo).length : 0
    const goal = c.goal ?? 1
    const pct = Math.min(100, Math.round((sets / goal) * 100))
    body = (
      <>
        <div className="row between small" style={{ marginTop: 8 }}>
          <span>{BRAND.words.Group} sets together</span>
          <b>{sets} of {goal}</b>
        </div>
        <div className="pbar" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={sets} aria-label={`${c.title} progress`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        {sets >= goal && <p className="small" style={{ margin: '8px 0 0', color: 'var(--primary)', fontWeight: 600 }}>Goal smashed. Riot on.</p>}
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
    <article className="card challenge">
      <div className="row between">
        <span className="pill">{c.kind === 'crew_goal' ? `🤝 ${BRAND.words.Group} goal` : '🏁 Points race'}</span>
        <span className="small muted">{label}</span>
      </div>
      <b className="challenge-title">{c.title}</b>
      <p className="small muted" style={{ margin: '2px 0 0' }}>{shortDate(c.start_date)} to {shortDate(c.end_date)} · started by {nameOf(c.created_by)}</p>
      {body}
      {c.stakes && <div className="stakes"><b>Stakes:</b> {c.stakes}</div>}
    </article>
  )
}
