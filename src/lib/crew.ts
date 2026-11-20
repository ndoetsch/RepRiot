import { useCallback, useEffect, useState } from 'react'
import { supabase, errorText } from './supabase'
import { localDate } from './dates'
import type { Crew, Exercise, Profile, SetLog } from './types'

export type CrewData = {
  crew: Crew
  members: Profile[]
  exercises: Exercise[]
  /** Sets logged today (in my time zone) by everyone in the crew. */
  todayLogs: SetLog[]
}

export async function fetchCrew(crewId: string): Promise<CrewData> {
  const today = localDate()
  const [crewRes, memberRes, exRes, logRes] = await Promise.all([
    supabase.from('crews').select('*').eq('id', crewId).single(),
    supabase.from('crew_members').select('user_id, joined_at').eq('crew_id', crewId).order('joined_at'),
    supabase.from('potluck_exercises').select('*').eq('crew_id', crewId).eq('active', true).order('created_at'),
    supabase.from('set_logs').select('*').eq('crew_id', crewId).eq('local_date', today),
  ])
  for (const r of [crewRes, memberRes, exRes, logRes]) if (r.error) throw r.error
  const ids = (memberRes.data ?? []).map((m) => m.user_id as string)
  const profRes = ids.length ? await supabase.from('profiles').select('*').in('id', ids) : { data: [], error: null }
  if (profRes.error) throw profRes.error
  const byId = new Map((profRes.data as Profile[]).map((p) => [p.id, p]))
  return {
    crew: crewRes.data as Crew,
    members: ids.map((id) => byId.get(id)).filter((p): p is Profile => Boolean(p)),
    exercises: (exRes.data ?? []) as Exercise[],
    todayLogs: (logRes.data ?? []) as SetLog[],
  }
}

export function useCrew(crewId: string | undefined) {
  const [data, setData] = useState<CrewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!crewId) return
    try {
      setData(await fetchCrew(crewId))
      setError(null)
    } catch (e) {
      setError(errorText(e))
    }
  }, [crewId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, reload }
}

export type MyCrew = Crew & { member_count: number }

export async function fetchMyCrews(userId: string): Promise<MyCrew[]> {
  const { data: rows, error } = await supabase.from('crew_members').select('crew_id').eq('user_id', userId)
  if (error) throw error
  const ids = (rows ?? []).map((r) => r.crew_id as string)
  if (!ids.length) return []
  const [crews, members] = await Promise.all([
    supabase.from('crews').select('*').in('id', ids).order('created_at'),
    supabase.from('crew_members').select('crew_id').in('crew_id', ids),
  ])
  if (crews.error) throw crews.error
  if (members.error) throw members.error
  const counts = new Map<string, number>()
  for (const m of members.data ?? []) counts.set(m.crew_id, (counts.get(m.crew_id) ?? 0) + 1)
  return (crews.data as Crew[]).map((c) => ({ ...c, member_count: counts.get(c.id) ?? 1 }))
}

const LAST_CREW = 'repriot.lastCrew'
export const lastCrew = {
  get: () => {
    try {
      return localStorage.getItem(LAST_CREW)
    } catch {
      return null
    }
  },
  set: (id: string) => {
    try {
      localStorage.setItem(LAST_CREW, id)
    } catch {
      /* ignore */
    }
  },
}

export function inviteLink(code: string): string {
  return `${window.location.origin}/join/${code}`
}
