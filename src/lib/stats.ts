import { useCallback, useEffect, useState } from 'react'
import { addDays, localDate, weekStart } from './dates'
import { badges, pointsBetween, streakInfo, weeklyPoints, type Badge, type PotluckSize, type StreakInfo } from './score'
import { errorText, supabase } from './supabase'
import type { Challenge, SetLog } from './types'

const PAGE = 1000

/** All of a crew's sets since a date. Pages through, since Supabase returns 1,000 rows at a time. */
export async function fetchCrewLogs(crewId: string, since: string): Promise<SetLog[]> {
  const out: SetLog[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('set_logs')
      .select('*')
      .eq('crew_id', crewId)
      .gte('local_date', since)
      .order('logged_at')
      .range(from, from + PAGE - 1)
    if (error) throw error
    out.push(...((data ?? []) as SetLog[]))
    if (!data || data.length < PAGE) return out
  }
}

export type CrewStats = {
  today: string
  logs: SetLog[]
  myStreak: StreakInfo
  /** Points this week (Monday to Sunday) per person. */
  weekPoints: Map<string, number>
  myWeeks: { week: string; points: number }[]
  badges: Badge[]
  challenges: Challenge[]
  /** Exercises on the table on a given day. */
  potluckSize: PotluckSize
}

/**
 * Exercises on the table on a day = members who had brought one by then.
 * A swap keeps the count the same; a new member raises it from the day they brought theirs.
 */
async function fetchPotluckSize(crewId: string, current: number): Promise<PotluckSize> {
  const [{ data, error }, crew] = await Promise.all([
    supabase.from('potluck_exercises').select('user_id, created_at').eq('crew_id', crewId),
    supabase.from('crews').select('solo').eq('id', crewId).single(),
  ])
  if (error) throw error
  if (crew.error) throw crew.error
  // Solo runs have several moves from one person, so the lineup is simply today's moves.
  if ((crew.data as { solo: boolean }).solo) return current
  const firstDay = new Map<string, string>()
  for (const r of (data ?? []) as { user_id: string; created_at: string }[]) {
    const day = localDate(new Date(r.created_at))
    const prev = firstDay.get(r.user_id)
    if (!prev || day < prev) firstDay.set(r.user_id, day)
  }
  const days = [...firstDay.values()]
  return (day: string) => Math.min(current, days.filter((d) => d <= day).length) || current
}

const HISTORY_DAYS = 84

export async function fetchStats(crewId: string, userId: string, exerciseCount: number): Promise<CrewStats> {
  const today = localDate()
  const { data: chData, error: chErr } = await supabase
    .from('challenges')
    .select('*')
    .eq('crew_id', crewId)
    .gte('end_date', addDays(today, -30))
    .order('end_date')
  if (chErr) throw chErr
  const challenges = (chData ?? []) as Challenge[]

  let since = addDays(today, -HISTORY_DAYS)
  for (const c of challenges) if (c.start_date < since) since = c.start_date

  const [logs, reacted, potluckSize] = await Promise.all([
    fetchCrewLogs(crewId, since),
    supabase.from('reactions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    fetchPotluckSize(crewId, exerciseCount),
  ])
  const myLogs = logs.filter((l) => l.user_id === userId)
  const myStreak = streakInfo(new Set(myLogs.map((l) => l.local_date)), today)
  const thisWeek = weekStart(today)

  return {
    today,
    logs,
    myStreak,
    weekPoints: pointsBetween(logs, potluckSize, thisWeek, addDays(thisWeek, 6)),
    myWeeks: weeklyPoints(myLogs, potluckSize, today, 5),
    badges: badges(userId, { myLogs, crewLogs: logs, exerciseCount: potluckSize, streak: myStreak.streak, reactionsGiven: reacted.count ?? 0, today }),
    challenges,
    potluckSize,
  }
}

export function useStats(crewId: string, userId: string | undefined, exerciseCount: number | undefined) {
  const [stats, setStats] = useState<CrewStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId || exerciseCount === undefined) return
    try {
      setStats(await fetchStats(crewId, userId, exerciseCount))
      setError(null)
    } catch (e) {
      setError(errorText(e))
    }
  }, [crewId, userId, exerciseCount])

  useEffect(() => {
    void reload()
  }, [reload])

  return { stats, error, reload }
}
