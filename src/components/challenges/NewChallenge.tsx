import { useState, type FormEvent } from 'react'
import { BRAND } from '../../config/brand'
import { isOn } from '../../config/features'
import { RULES } from '../../config/rules'
import { addDays } from '../../lib/dates'
import { errorText, supabase } from '../../lib/supabase'
import type { Challenge } from '../../lib/types'

type Kind = Challenge['kind']

const KINDS: { kind: Kind; label: string; help: string; on: () => boolean; squadOnly: boolean }[] = [
  { kind: 'gauntlet', label: '⚔️ Gauntlet', help: 'Propose it, the squad debates and votes. Once it passes, everyone is in.', on: () => isOn('gauntlets'), squadOnly: true },
  { kind: 'open', label: '🎲 Open dare', help: 'Throw it out there. Anyone who is brave enough opts in.', on: () => isOn('openChallenges'), squadOnly: false },
  { kind: 'points', label: '🏁 Points race', help: 'Most points between the dates wins.', on: () => isOn('classicChallenges'), squadOnly: true },
  { kind: 'crew_goal', label: '🤝 Squad goal', help: 'Everyone chips in toward one big number of sets.', on: () => isOn('classicChallenges'), squadOnly: true },
]

const DEFAULT_STAKES = 'Last one standing picks the next group dinner. Everyone who fails does 20 burpees on video.'

type Props = {
  crewId: string
  userId: string
  today: string
  solo: boolean
  /** A gauntlet being reworded while the squad is still voting. */
  editing?: Challenge
  onDone: () => void
  onCancel: () => void
}

export function ChallengeForm({ crewId, userId, today, solo, editing, onDone, onCancel }: Props) {
  const kinds = KINDS.filter((k) => k.on() && (!solo || !k.squadOnly))
  const [kind, setKind] = useState<Kind>(editing?.kind ?? kinds[0]?.kind ?? 'open')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [goal, setGoal] = useState(String(editing?.goal ?? (kind === 'crew_goal' ? 200 : 15)))
  const [length, setLength] = useState<number>(editing?.length_days ?? 7)
  const [stakes, setStakes] = useState(editing?.stakes ?? (solo ? '' : DEFAULT_STAKES))
  const [details, setDetails] = useState(editing?.details ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsGoal = kind !== 'points'
  const each = kind === 'gauntlet' || kind === 'open'

  async function submit(e: FormEvent) {
    e.preventDefault()
    const g = Number(goal)
    if (needsGoal && (!Number.isInteger(g) || g < 1)) return setError('Pick a goal of at least 1 set.')
    setBusy(true)
    setError(null)
    let err
    if (editing) {
      ;({ error: err } = await supabase.rpc('amend_gauntlet', {
        p_challenge: editing.id, p_title: title.trim(), p_goal: g, p_length: length, p_stakes: stakes.trim(), p_details: details.trim(), p_today: today,
      }))
    } else if (kind === 'gauntlet') {
      ;({ error: err } = await supabase.rpc('propose_gauntlet', {
        p_crew: crewId, p_title: title.trim(), p_goal: g, p_length: length, p_stakes: stakes.trim(), p_details: details.trim(), p_today: today,
      }))
    } else {
      ;({ error: err } = await supabase.from('challenges').insert({
        crew_id: crewId,
        created_by: userId,
        title: title.trim(),
        kind,
        goal: needsGoal ? g : null,
        start_date: today,
        end_date: addDays(today, length - 1),
        length_days: length,
        stakes: stakes.trim(),
        details: details.trim(),
      }))
    }
    setBusy(false)
    if (err) return setError(errorText(err))
    onDone()
  }

  const current = KINDS.find((k) => k.kind === kind)

  return (
    <form className="card stack" onSubmit={submit}>
      <b>{editing ? 'Change the terms' : solo ? 'New personal challenge' : 'Throw down a challenge'}</b>
      {!editing && kinds.length > 1 && (
        <div className="chips" role="group" aria-label="Challenge type">
          {kinds.map((k) => (
            <button key={k.kind} type="button" className="chip" aria-pressed={kind === k.kind} onClick={() => setKind(k.kind)}>{k.label}</button>
          ))}
        </div>
      )}
      {current && !solo && <p className="small muted" style={{ margin: 0 }}>{current.help}</p>}
      <div>
        <label htmlFor="ch-title">Name it</label>
        <input id="ch-title" type="text" required maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'gauntlet' ? 'The December Gauntlet' : '100 squats by Sunday'} />
      </div>
      {needsGoal && (
        <div>
          <label htmlFor="ch-goal">{each ? 'Sets each person has to do' : `Sets the whole ${BRAND.words.group} does together`}</label>
          <input id="ch-goal" type="number" inputMode="numeric" min={1} max={100000} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
      )}
      <div>
        <span className="label" id="ch-len">How long{kind === 'gauntlet' ? ', once it passes' : ', starting today'}</span>
        <div className="chips" role="group" aria-labelledby="ch-len">
          {RULES.challengeLengths.map((n) => (
            <button key={n} type="button" className="chip" aria-pressed={length === n} onClick={() => setLength(n)}>{n} days</button>
          ))}
        </div>
      </div>
      {each && (
        <div>
          <label htmlFor="ch-details">The rules <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <textarea id="ch-details" maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Any move counts. Sets done at the gym count too." />
        </div>
      )}
      <div>
        <label htmlFor="ch-stakes">Stakes <span className="muted" style={{ fontWeight: 400 }}>(optional, settled in real life)</span></label>
        <textarea id="ch-stakes" maxLength={280} value={stakes} onChange={(e) => setStakes(e.target.value)} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={busy || !title.trim()}>
          {busy ? 'Saving…' : editing ? 'Save and re-vote' : kind === 'gauntlet' ? 'Put it to a vote' : kind === 'open' ? (solo ? 'Start it' : 'Throw it down') : 'Start it'}
        </button>
      </div>
    </form>
  )
}
