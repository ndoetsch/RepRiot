import { useCallback, useEffect, useState } from 'react'
import { errorText, supabase } from './supabase'
import type { ChallengeComment, ChallengeParticipant, ChallengeVote } from './types'

export * from './challengeMath'

export type ChallengeExtras = {
  votes: ChallengeVote[]
  participants: ChallengeParticipant[]
  comments: ChallengeComment[]
}

export async function fetchExtras(ids: string[]): Promise<ChallengeExtras> {
  if (!ids.length) return { votes: [], participants: [], comments: [] }
  const [v, p, c] = await Promise.all([
    supabase.from('challenge_votes').select('*').in('challenge_id', ids),
    supabase.from('challenge_participants').select('*').in('challenge_id', ids),
    supabase.from('challenge_comments').select('*').in('challenge_id', ids).order('created_at'),
  ])
  for (const r of [v, p, c]) if (r.error) throw r.error
  return {
    votes: (v.data ?? []) as ChallengeVote[],
    participants: (p.data ?? []) as ChallengeParticipant[],
    comments: (c.data ?? []) as ChallengeComment[],
  }
}

/** Votes, opt-ins and debate for a squad's challenges, kept live. */
export function useChallengeExtras(crewId: string, ids: string[]) {
  const [extras, setExtras] = useState<ChallengeExtras | null>(null)
  const [error, setError] = useState<string | null>(null)
  const key = ids.join(',')

  const reload = useCallback(async () => {
    try {
      setExtras(await fetchExtras(key ? key.split(',') : []))
      setError(null)
    } catch (e) {
      setError(errorText(e))
    }
  }, [key])

  useEffect(() => {
    void reload()
    const channel = supabase
      .channel(`challenges-${crewId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_comments' }, () => void reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_votes' }, () => void reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_participants' }, () => void reload())
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [crewId, reload])

  return { extras, error, reload }
}
