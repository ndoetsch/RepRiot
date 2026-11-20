// Points, streaks, freezes and badges, all worked out from logged sets.
// Pure functions with no database calls, so they are easy to test.

import { addDays, parseDate, weekStart } from './dates'
import { FREEZES_PER_MONTH, POINTS_PER_SET, POTLUCK_BONUS, SETS_PER_DAY, type SetLog } from './types'

type LogLite = Pick<SetLog, 'user_id' | 'exercise_id' | 'local_date' | 'logged_at'>

/**
 * How many exercises were on the potluck table. Either a fixed number, or a
 * function of the day, so that someone joining later doesn't take away
 * bonuses people already earned.
 */
export type PotluckSize = number | ((day: string) => number)

export function sizeOn(size: PotluckSize, day: string): number {
  return typeof size === 'number' ? size : size(day)
}

/** Points for one person's sets on one day: 10 a set, +25 if they did every potluck exercise. */
export function dayPoints(logs: LogLite[], size: PotluckSize): number {
  if (!logs.length) return 0
  const exerciseCount = sizeOn(size, logs[0].local_date)
  const distinct = new Set(logs.map((l) => l.exercise_id)).size
  const bonus = exerciseCount > 0 && distinct >= exerciseCount ? POTLUCK_BONUS : 0
  return logs.length * POINTS_PER_SET + bonus
}

/** Groups logs by person, then by day. */
export function byUserDay(logs: LogLite[]): Map<string, Map<string, LogLite[]>> {
  const out = new Map<string, Map<string, LogLite[]>>()
  for (const l of logs) {
    let days = out.get(l.user_id)
    if (!days) out.set(l.user_id, (days = new Map()))
    const list = days.get(l.local_date)
    if (list) list.push(l)
    else days.set(l.local_date, [l])
  }
  return out
}

/** Total points per person for days in [from, to] (inclusive). */
export function pointsBetween(logs: LogLite[], exerciseCount: PotluckSize, from: string, to: string): Map<string, number> {
  const totals = new Map<string, number>()
  for (const [user, days] of byUserDay(logs)) {
    let sum = 0
    for (const [day, list] of days) if (day >= from && day <= to) sum += dayPoints(list, exerciseCount)
    totals.set(user, sum)
  }
  return totals
}

export type StreakInfo = {
  /** Days in a row with at least one set (frozen days keep it alive but don't add to it). */
  streak: number
  /** Freezes left this calendar month. */
  freezesLeft: number
  /** Days that were saved by a freeze, newest first. */
  frozenDays: string[]
}

/**
 * Walks back from today. A day with a set adds to the streak. A missed day
 * uses a freeze if that month still has one; otherwise the streak ends.
 * Today never breaks a streak, since there's still time to move.
 */
export function streakInfo(myDays: Set<string>, today: string, maxDays = 365): StreakInfo {
  const usedPerMonth = new Map<string, number>()
  const committed: string[] = []
  let pending: string[] = []
  let streak = 0
  const earliest = [...myDays].sort()[0]

  for (let i = 0; i < maxDays; i++) {
    const day = addDays(today, -i)
    if (earliest === undefined || day < earliest) break
    if (myDays.has(day)) {
      streak++
      committed.push(...pending)
      pending = []
      continue
    }
    if (i === 0) continue
    const month = day.slice(0, 7)
    const used = usedPerMonth.get(month) ?? 0
    if (used >= FREEZES_PER_MONTH) break
    usedPerMonth.set(month, used + 1)
    pending.push(day)
  }

  const thisMonth = today.slice(0, 7)
  const usedThisMonth = committed.filter((d) => d.startsWith(thisMonth)).length
  return { streak, freezesLeft: Math.max(0, FREEZES_PER_MONTH - usedThisMonth), frozenDays: committed }
}

/** My points for each of the last `weeks` weeks, oldest first, ending with this week. */
export function weeklyPoints(myLogs: LogLite[], exerciseCount: PotluckSize, today: string, weeks = 5): { week: string; points: number }[] {
  const days = byUserDay(myLogs)
  const all = [...days.values()][0] ?? new Map<string, LogLite[]>()
  const thisWeek = weekStart(today)
  const out: { week: string; points: number }[] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const start = addDays(thisWeek, -7 * w)
    const end = addDays(start, 6)
    let sum = 0
    for (const [day, list] of all) if (day >= start && day <= end) sum += dayPoints(list, exerciseCount)
    out.push({ week: start, points: sum })
  }
  return out
}

export type Badge = { id: string; name: string; how: string; earned: boolean }

type BadgeInput = {
  myLogs: LogLite[]
  crewLogs: LogLite[]
  exerciseCount: PotluckSize
  streak: number
  reactionsGiven: number
  today: string
}

/** Did this person win a finished week (most points, at least one set)? */
function wonAWeek(userId: string, crewLogs: LogLite[], exerciseCount: PotluckSize, today: string): boolean {
  const thisWeek = weekStart(today)
  const weeks = new Set(crewLogs.map((l) => weekStart(l.local_date)))
  for (const w of weeks) {
    if (w >= thisWeek) continue
    const totals = pointsBetween(crewLogs, exerciseCount, w, addDays(w, 6))
    const best = Math.max(...totals.values())
    if (best > 0 && totals.get(userId) === best) return true
  }
  return false
}

export function badges(userId: string, input: BadgeInput): Badge[] {
  const { myLogs, crewLogs, exerciseCount, streak, reactionsGiven, today } = input
  const perDay = [...(byUserDay(myLogs).get(userId)?.values() ?? [])]
  const hours = myLogs.map((l) => new Date(l.logged_at).getHours())
  const sizeFor = (d: LogLite[]) => sizeOn(exerciseCount, d[0].local_date)
  const perfect = perDay.some((d) => sizeFor(d) > 0 && new Set(d.map((l) => l.exercise_id)).size >= sizeFor(d))
  const fullPlate = perDay.some((d) => sizeFor(d) > 0 && d.length >= sizeFor(d) * SETS_PER_DAY)

  return [
    { id: 'first', name: 'First Set', how: 'Log your first set', earned: myLogs.length > 0 },
    { id: 'roll', name: 'On a Roll', how: '3-day streak', earned: streak >= 3 },
    { id: 'week', name: 'Week Warrior', how: '7-day streak', earned: streak >= 7 },
    { id: 'perfect', name: 'Potluck Perfect', how: 'Every potluck exercise in one day', earned: perfect },
    { id: 'plate', name: 'Full Plate', how: 'All 3 sets of everything in one day', earned: fullPlate },
    { id: 'early', name: 'Early Bird', how: 'A set before 7 AM', earned: hours.some((h) => h < 7) },
    { id: 'owl', name: 'Night Owl', how: 'A set after 9 PM', earned: hours.some((h) => h >= 21) },
    { id: 'hype', name: 'Hype Squad', how: 'Give 10 reactions', earned: reactionsGiven >= 10 },
    { id: 'century', name: 'Century Club', how: '100 sets', earned: myLogs.length >= 100 },
    { id: 'champ', name: 'Weekly Champ', how: 'Win a week on the leaderboard', earned: wonAWeek(userId, crewLogs, exerciseCount, today) },
  ]
}

/** Days left in a challenge, counting today. */
export function daysLeft(endDate: string, today: string): number {
  return Math.max(0, Math.round((parseDate(endDate).getTime() - parseDate(today).getTime()) / 86400000) + 1)
}
