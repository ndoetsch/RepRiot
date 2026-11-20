import { useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Loading } from '../components/Loading'
import { TabBar } from '../components/TabBar'
import { useAuth } from '../lib/auth'
import { useCrew } from '../lib/crew'
import { addDays, shortDate, weekStart } from '../lib/dates'
import { RULES } from '../config/rules'
import { useStats } from '../lib/stats'

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

export function Leaders() {
  const { crewId = '' } = useParams()
  const { profile } = useAuth()
  const { data, error: crewError } = useCrew(crewId)
  const { stats, error } = useStats(crewId, profile?.id, data?.exercises.length)

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
              <p className="small muted" style={{ margin: '8px 0 0' }}>{RULES.pointsPerSet} points a set, plus {RULES.lineupBonus} for doing every move in the lineup in a day.</p>
            </section>

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
