import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ClassicCard, DareCard, GauntletCard } from '../components/challenges/Cards'
import { ChallengeForm } from '../components/challenges/NewChallenge'
import { Loading } from '../components/Loading'
import { TabBar } from '../components/TabBar'
import { BRAND } from '../config/brand'
import { useAuth } from '../lib/auth'
import { useChallengeExtras } from '../lib/challenges'
import { useCrew } from '../lib/crew'
import { useStats } from '../lib/stats'
import type { Challenge } from '../lib/types'

/** Voting first (it needs people), then what's running, then what's finished. */
function order(a: Challenge, b: Challenge, today: string): number {
  const rank = (c: Challenge) => (c.status === 'voting' ? 0 : c.status === 'rejected' ? 3 : c.end_date >= today ? 1 : 2)
  return rank(a) - rank(b) || a.end_date.localeCompare(b.end_date)
}

export function Challenges() {
  const { crewId = '' } = useParams()
  const { profile } = useAuth()
  const { data, error: crewError } = useCrew(crewId)
  const { stats, error, reload } = useStats(crewId, profile?.id, data?.exercises.length)
  const ids = stats?.challenges.map((c) => c.id) ?? []
  const { extras, reload: reloadExtras } = useChallengeExtras(crewId, ids)
  const [creating, setCreating] = useState(false)

  if (crewError) return <main className="screen"><p className="error">{crewError}</p></main>
  if (!data || !profile) return <Loading />

  const solo = data.crew.solo
  const refresh = () => {
    void reload()
    void reloadExtras()
  }
  const list = stats ? [...stats.challenges].sort((a, b) => order(a, b, stats.today)) : []

  return (
    <>
      <main className="screen with-tabs">
        <div className="top">
          <h1 style={{ fontSize: 26 }}>Challenges</h1>
          {!creating && <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>New</button>}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {(!stats || !extras) && !error && <div className="spinner" aria-label="Loading" />}
        {stats && extras && (
          <div className="stack">
            {creating && (
              <ChallengeForm
                crewId={crewId}
                userId={profile.id}
                today={stats.today}
                solo={solo}
                onDone={() => {
                  setCreating(false)
                  refresh()
                }}
                onCancel={() => setCreating(false)}
              />
            )}
            {list.map((c) => {
              const props = { c, stats, members: data.members, meId: profile.id, extras, onChange: refresh }
              if (c.kind === 'gauntlet') return <GauntletCard key={c.id} {...props} />
              if (c.kind === 'open') return <DareCard key={c.id} {...props} />
              return <ClassicCard key={c.id} {...props} />
            })}
            {list.length === 0 && !creating && (
              <div className="card center">
                <p style={{ fontSize: 32, margin: 0 }} aria-hidden="true">⚔️</p>
                <b>No challenges yet</b>
                <p className="small muted" style={{ margin: '6px 0 0' }}>
                  {solo
                    ? 'Set yourself a personal challenge, like 30 sets this week.'
                    : `Propose a gauntlet for the whole ${BRAND.words.group} to debate and vote on, or throw down an open dare and see who bites.`}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      <TabBar crewId={crewId} />
    </>
  )
}
