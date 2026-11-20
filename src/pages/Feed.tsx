import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Loading } from '../components/Loading'
import { Media } from '../components/Media'
import { TabBar } from '../components/TabBar'
import { useAuth } from '../lib/auth'
import { timeAgo } from '../lib/dates'
import { errorText, supabase } from '../lib/supabase'
import { REACTIONS, SETS_PER_DAY, type Exercise, type Profile, type Reaction, type SetLog } from '../lib/types'

type FeedState = {
  logs: SetLog[]
  people: Map<string, Profile>
  exercises: Map<string, Exercise>
  reactions: Reaction[]
}

async function loadFeed(crewId: string): Promise<FeedState> {
  const { data: logs, error } = await supabase.from('set_logs').select('*').eq('crew_id', crewId).order('logged_at', { ascending: false }).limit(60)
  if (error) throw error
  const list = (logs ?? []) as SetLog[]
  const userIds = [...new Set(list.map((l) => l.user_id))]
  const exIds = [...new Set(list.map((l) => l.exercise_id))]
  const logIds = list.map((l) => l.id)
  const [people, exercises, reactions] = await Promise.all([
    userIds.length ? supabase.from('profiles').select('*').in('id', userIds) : Promise.resolve({ data: [], error: null }),
    exIds.length ? supabase.from('potluck_exercises').select('*').in('id', exIds) : Promise.resolve({ data: [], error: null }),
    logIds.length ? supabase.from('reactions').select('log_id, user_id, emoji').in('log_id', logIds) : Promise.resolve({ data: [], error: null }),
  ])
  for (const r of [people, exercises, reactions]) if (r.error) throw r.error
  return {
    logs: list,
    people: new Map(((people.data ?? []) as Profile[]).map((p) => [p.id, p])),
    exercises: new Map(((exercises.data ?? []) as Exercise[]).map((e) => [e.id, e])),
    reactions: (reactions.data ?? []) as Reaction[],
  }
}

/** Which set number this was for that person, that day (1, 2 or 3). */
function setNumber(log: SetLog, all: SetLog[]): number {
  return all.filter((l) => l.user_id === log.user_id && l.exercise_id === log.exercise_id && l.local_date === log.local_date && l.logged_at <= log.logged_at).length
}

export function Feed() {
  const { crewId = '' } = useParams()
  const { profile } = useAuth()
  const [feed, setFeed] = useState<FeedState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    loadFeed(crewId).then(setFeed).catch((e) => setError(errorText(e)))
  }, [crewId])

  useEffect(() => {
    reload()
    const channel = supabase
      .channel(`feed-${crewId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'set_logs', filter: `crew_id=eq.${crewId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, reload)
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [crewId, reload])

  async function toggle(logId: string, emoji: string, mine: boolean) {
    if (!profile || !feed) return
    // Update right away so it feels instant, then save.
    setFeed({
      ...feed,
      reactions: mine
        ? feed.reactions.filter((r) => !(r.log_id === logId && r.user_id === profile.id && r.emoji === emoji))
        : [...feed.reactions, { log_id: logId, user_id: profile.id, emoji }],
    })
    const res = mine
      ? await supabase.from('reactions').delete().match({ log_id: logId, user_id: profile.id, emoji })
      : await supabase.from('reactions').insert({ log_id: logId, user_id: profile.id, emoji })
    if (res.error) {
      setError(errorText(res.error))
      reload()
    }
  }

  if (!profile) return <Loading />

  return (
    <>
      <main className="screen with-tabs">
        <div className="top"><h1 style={{ fontSize: 26 }}>Squad feed</h1></div>
        {error && <p className="error" role="alert">{error}</p>}
        {!feed && !error && <div className="spinner" aria-label="Loading" />}
        {feed && feed.logs.length === 0 && (
          <div className="card center">
            <p style={{ marginTop: 0 }}>Nothing yet. Be the first to move.</p>
            <Link to={`/crew/${crewId}`} className="btn btn-primary">Go to today</Link>
          </div>
        )}
        <div className="stack">
          {feed?.logs.map((log) => {
            const who = feed.people.get(log.user_id)
            const ex = feed.exercises.get(log.exercise_id)
            if (!who || !ex) return null
            const n = setNumber(log, feed.logs)
            const what = n >= SETS_PER_DAY ? `finished all ${SETS_PER_DAY} sets of ${ex.name}` : `did set ${n} of ${ex.name}`
            const here = feed.reactions.filter((r) => r.log_id === log.id)
            return (
              <article key={log.id} className="card post">
                <Avatar profile={who} />
                <div className="body">
                  <div><b>{who.id === profile.id ? 'You' : who.display_name}</b> {what}</div>
                  <div className="small muted">{timeAgo(log.logged_at)}</div>
                  <div className="mini-media"><Media exercise={ex} playing={false} /></div>
                  <div className="reacts">
                    {REACTIONS.map((emoji) => {
                      const count = here.filter((r) => r.emoji === emoji).length
                      const mine = here.some((r) => r.emoji === emoji && r.user_id === profile.id)
                      return (
                        <button key={emoji} type="button" className="react" aria-pressed={mine} aria-label={`React ${emoji}${count ? `, ${count} so far` : ''}`} onClick={() => toggle(log.id, emoji, mine)}>
                          {emoji} {count || ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </main>
      <TabBar crewId={crewId} />
    </>
  )
}
