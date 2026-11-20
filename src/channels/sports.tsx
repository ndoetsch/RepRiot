import { useEffect, useState, type FormEvent } from 'react'
import { load, save } from './store'
import type { Channel, ChannelViewProps } from './types'

export const LEAGUES = [
  { id: 'nfl', name: 'NFL' },
  { id: 'nba', name: 'NBA' },
  { id: 'mlb', name: 'MLB' },
  { id: 'nhl', name: 'NHL' },
  { id: 'wnba', name: 'WNBA' },
  { id: 'mls', name: 'MLS' },
  { id: 'epl', name: 'Premier League' },
  { id: 'ncaaf', name: 'College football' },
  { id: 'ncaab', name: 'College basketball' },
] as const

type Pick = { league: string; team: string }
type Result = { games: string[]; headlines: { headline: string; description: string }[] }

function SportsView({ say }: ChannelViewProps) {
  const [pick, setPick] = useState<Pick | null>(() => load<Pick | null>('sportsTeam', null))
  const [editing, setEditing] = useState(!pick)
  const [league, setLeague] = useState(pick?.league ?? 'nfl')
  const [team, setTeam] = useState(pick?.team ?? '')
  const [result, setResult] = useState<Result | null>(null)
  const [failed, setFailed] = useState(false)
  const [i, setI] = useState(0)

  useEffect(() => {
    if (!pick || editing) return
    setResult(null)
    setFailed(false)
    fetch(`/api/sports?league=${pick.league}&team=${encodeURIComponent(pick.team)}`)
      .then((r) => (r.ok ? (r.json() as Promise<Result>) : Promise.reject(new Error(String(r.status)))))
      .then((r) => {
        setResult(r)
        setI(0)
      })
      .catch(() => setFailed(true))
  }, [pick, editing])

  const lines = result ? [...result.games, ...result.headlines.map((h) => `${h.headline}. ${h.description}`)] : []
  const line = lines[i]
  useEffect(() => {
    if (line) say(line)
  }, [line, say])

  function submit(e: FormEvent) {
    e.preventDefault()
    const p = { league, team: team.trim() }
    save('sportsTeam', p)
    setPick(p)
    setEditing(false)
  }

  if (editing || !pick) {
    return (
      <form className="channel-card" onSubmit={submit}>
        <span className="eyebrow">🏟️ Your team</span>
        <label htmlFor="sp-league">League</label>
        <select id="sp-league" className="select" value={league} onChange={(e) => setLeague(e.target.value)}>
          {LEAGUES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <label htmlFor="sp-team">Team <span className="muted" style={{ fontWeight: 400 }}>(blank for the whole league)</span></label>
        <input id="sp-team" type="text" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Chiefs" maxLength={40} />
        <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: 'auto' }}>Show me</button>
      </form>
    )
  }

  const leagueName = LEAGUES.find((l) => l.id === pick.league)?.name ?? pick.league
  return (
    <div className="channel-card">
      <div className="row between">
        <span className="eyebrow">🏟️ {pick.team || leagueName}{lines.length ? ` · ${i + 1} of ${lines.length}` : ''}</span>
        <button type="button" className="link-btn small" style={{ minHeight: 0 }} onClick={() => setEditing(true)}>Change</button>
      </div>
      {failed && <p className="channel-body">Sports updates wouldn't load right now. Try again in a bit.</p>}
      {!result && !failed && <div className="spinner" aria-label="Loading" />}
      {result && !lines.length && <p className="channel-body">Nothing new on {pick.team || leagueName} right now. Quiet day.</p>}
      {line && <p className="channel-body" aria-live="polite">{line}</p>}
      {lines.length > 1 && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 'auto', alignSelf: 'center' }} onClick={() => setI((i + 1) % lines.length)}>Next update</button>
      )}
    </div>
  )
}

export const sports: Channel = {
  id: 'sports',
  name: 'Your team',
  emoji: '🏟️',
  blurb: 'Scores and news on your favorite team',
  shelf: 'Stay current',
  View: SportsView,
}
