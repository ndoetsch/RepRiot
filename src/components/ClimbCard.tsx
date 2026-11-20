import { shortDate } from '../lib/dates'
import type { CrewStats } from '../lib/stats'

/** "Your climb": weekly points rising to the right, plus streak, points and freezes. */
export function ClimbCard({ stats, myPointsThisWeek }: { stats: CrewStats; myPointsThisWeek: number }) {
  const max = Math.max(1, ...stats.myWeeks.map((w) => w.points))
  const { streak, freezesLeft } = stats.myStreak
  const summary = stats.myWeeks.map((w, i) => `${i === stats.myWeeks.length - 1 ? 'this week' : `week of ${shortDate(w.week)}`}: ${w.points} points`).join(', ')
  return (
    <div className="card">
      <div className="row between">
        <b>Your climb</b>
        <span className="small muted">points per week</span>
      </div>
      <div className="climb" role="img" aria-label={`Your points per week. ${summary}`}>
        {stats.myWeeks.map((w, i) => {
          const now = i === stats.myWeeks.length - 1
          return <div key={w.week} className={`bar ${now ? 'now' : ''} ${w.points === 0 ? 'empty' : ''}`} style={{ height: `${Math.max(6, (w.points / max) * 100)}%` }} />
        })}
      </div>
      <div className="climb-labels" aria-hidden="true">
        {stats.myWeeks.map((w, i) => <span key={w.week}>{i === stats.myWeeks.length - 1 ? 'This wk' : shortDate(w.week)}</span>)}
      </div>
      <div className="stats">
        <div className="stat"><div className="num">{streak}</div><div className="small muted">day streak</div></div>
        <div className="stat"><div className="num">{myPointsThisWeek}</div><div className="small muted">points this week</div></div>
        <div className="stat"><div className="num">{freezesLeft}</div><div className="small muted">freezes left</div></div>
      </div>
    </div>
  )
}
