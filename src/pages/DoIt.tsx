import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Back } from '../components/Back'
import { Loading } from '../components/Loading'
import { Logo } from '../components/Logo'
import { ChannelPicker } from '../components/ChannelPicker'
import { channelById, favoriteChannel } from '../channels/registry'
import { onSpeechProblem, readAloud, speak, speechProblem, stopSpeaking } from '../channels/speech'
import { RULES } from '../config/rules'
import { useAuth } from '../lib/auth'
import { useCrew } from '../lib/crew'
import { localDate } from '../lib/dates'
import { exerciseLabel } from '../lib/format'
import { cheerGif } from '../lib/giphy'
import { errorText, supabase } from '../lib/supabase'

const { setsPerDay: SETS_PER_DAY, pointsPerSet: POINTS_PER_SET, lineupBonus: LINEUP_BONUS } = RULES

export function DoIt() {
  const { crewId = '', exerciseId = '' } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { data, error: loadError } = useCrew(crewId)

  const [count, setCount] = useState(0)
  const [variant, setVariant] = useState<'standard' | 'modified'>('standard')
  const [howTo, setHowTo] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cheer, setCheer] = useState<{ gif: string | null; finished: boolean; points: number; bonus: boolean } | null>(null)
  const okRef = useRef<HTMLButtonElement>(null)
  const [channelId, setChannelId] = useState(favoriteChannel.get)
  const [aloud, setAloud] = useState(readAloud.get)
  const channel = channelById(channelId)
  const say = useCallback((text: string, lang?: string, now?: boolean) => {
    if (aloud || now) speak(text, lang)
  }, [aloud])
  const [voiceProblem, setVoiceProblem] = useState(speechProblem)
  useEffect(() => onSpeechProblem(() => setVoiceProblem(speechProblem())), [])

  useEffect(() => stopSpeaking, [])

  function pickChannel(id: string) {
    stopSpeaking()
    setChannelId(id)
    favoriteChannel.set(id)
  }

  function toggleAloud() {
    readAloud.set(!aloud)
    setAloud(!aloud)
  }

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  useEffect(() => {
    if (cheer) okRef.current?.focus()
  }, [cheer])

  if (loadError) return <main className="screen"><p className="error">{loadError}</p></main>
  if (!data || !profile) return <Loading />

  const exercise = data.exercises.find((e) => e.id === exerciseId)
  if (!exercise) {
    return (
      <main className="screen">
        <p>This exercise was swapped out.</p>
        <Link to={`/crew/${crewId}`} className="btn btn-primary">Back to today</Link>
      </main>
    )
  }
  const doneSoFar = data.todayLogs.filter((l) => l.user_id === profile.id && l.exercise_id === exercise.id).length
  const owner = data.members.find((m) => m.id === exercise.user_id)
  const modLabel = exercise.modifier.split(':')[0]?.trim()
  const timed = exercise.mode === 'seconds'

  async function log(quick: boolean) {
    if (!exercise || !profile) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.from('set_logs').insert({
      crew_id: crewId,
      exercise_id: exercise.id,
      user_id: profile.id,
      local_date: localDate(),
      quick_log: quick,
    })
    setBusy(false)
    if (err) return setError(errorText(err))
    channel.onSetLogged?.()
    stopSpeaking()
    const gif = await cheerGif()
    const mineToday = new Set(data!.todayLogs.filter((l) => l.user_id === profile.id).map((l) => l.exercise_id))
    const hadAll = mineToday.size >= data!.exercises.length
    mineToday.add(exercise.id)
    const bonus = !hadAll && mineToday.size >= data!.exercises.length
    setCheer({ gif, finished: doneSoFar + 1 >= SETS_PER_DAY, points: POINTS_PER_SET + (bonus ? LINEUP_BONUS : 0), bonus })
  }

  return (
    <main className="screen">
      <div className="top">
        <Back to={`/crew/${crewId}`} />
        <span className="eyebrow">Set {Math.min(doneSoFar + 1, SETS_PER_DAY)} of {SETS_PER_DAY}</span>
        {exercise.tutorial ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHowTo(true)}>How to</button>
        ) : (
          <span style={{ width: 44 }} />
        )}
      </div>

      <ChannelPicker value={channel.id} onChange={pickChannel} />

      <div className="stage">
        <channel.View key={channel.id} exercise={exercise} say={say} />
      </div>
      {readAloud.available() && channel.id !== 'form' && channel.id !== 'video' && (
        <button type="button" className="link-btn small" style={{ alignSelf: 'flex-start', minHeight: 36 }} aria-pressed={aloud} onClick={toggleAloud}>
          {aloud ? '🔊 Reading out loud' : '🔈 Read it out loud'}
        </button>
      )}
      {voiceProblem && channel.id !== 'form' && channel.id !== 'video' && (
        <p className="small muted" role="status" style={{ margin: '2px 0 0' }}>{voiceProblem}</p>
      )}

      <h1 style={{ fontSize: 24, marginTop: 10 }}>{exerciseLabel(exercise)}</h1>
      <p className="muted small" style={{ margin: '4px 0 10px' }}>Brought by {exercise.user_id === profile.id ? 'you' : owner?.display_name}</p>

      {modLabel && (
        <div className="seg" role="group" aria-label="Version">
          <button type="button" aria-pressed={variant === 'standard'} onClick={() => setVariant('standard')}>Standard</button>
          <button type="button" aria-pressed={variant === 'modified'} onClick={() => setVariant('modified')}>{modLabel}</button>
        </div>
      )}
      {variant === 'modified' && <p className="small muted" style={{ margin: '6px 0 0' }}>{exercise.modifier}</p>}

      {timed ? (
        <div className="center" style={{ margin: '14px 0' }}>
          <div className="counter" style={{ margin: 0 }}>
            <span className="big" aria-live="polite">{secondsLeft === null ? `${exercise.amount}s` : secondsLeft > 0 ? `${secondsLeft}s` : 'Done!'}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSecondsLeft(exercise.amount)}>
            {secondsLeft === null ? 'Start timer' : 'Restart timer'}
          </button>
        </div>
      ) : (
        <>
          <div className="counter">
            <button type="button" onClick={() => setCount((c) => Math.max(0, c - 1))} aria-label="Count down">−</button>
            <span className="big" aria-live="polite">{count}</span>
            <button type="button" onClick={() => setCount((c) => c + 1)} aria-label="Count a rep">+</button>
          </div>
          <p className="small muted center" style={{ margin: '-6px 0 10px' }}>Counting reps is optional.</p>
        </>
      )}

      {error && <p className="error" role="alert">{error}</p>}
      <div className="stack push">
        <button type="button" className="btn btn-primary" disabled={busy || doneSoFar >= SETS_PER_DAY} onClick={() => log(false)}>
          {busy ? 'Logging…' : 'Done'}
        </button>
      </div>
      <p className="small muted center" style={{ margin: '10px 0 0' }}>
        Did it somewhere else, like at the gym? Tap Done anyway. It counts.
      </p>

      {howTo && (
        <div className="overlay sheet-wrap" role="dialog" aria-modal="true" aria-labelledby="howto-h" onClick={(e) => e.target === e.currentTarget && setHowTo(false)}>
          <div className="sheet">
            <h2 id="howto-h" style={{ fontSize: 20, marginBottom: 8 }}>How to: {exercise.name}</h2>
            <p style={{ margin: '0 0 10px', lineHeight: 1.5 }}>{exercise.tutorial}</p>
            {exercise.modifier && <p className="small muted" style={{ margin: '0 0 18px' }}>Modifier: {exercise.modifier}</p>}
            <button type="button" className="btn btn-primary" onClick={() => setHowTo(false)} autoFocus>Got it</button>
          </div>
        </div>
      )}

      {cheer && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="cheer-h">
          <div className="pop">
            <div className="media" style={{ aspectRatio: '16 / 10', marginBottom: 14, background: cheer.gif ? 'var(--ink)' : 'var(--primary-soft)' }}>
              {cheer.gif ? <img src={cheer.gif} alt="Celebration GIF" /> : <Logo width={120} />}
            </div>
            <div className="pts">+{cheer.points}</div>
            <h2 id="cheer-h" style={{ fontSize: 22, margin: '4px 0' }}>{cheer.finished ? `All ${SETS_PER_DAY} sets done!` : 'Set logged!'}</h2>
            <p className="muted small" style={{ margin: '0 0 18px' }}>{cheer.bonus ? `Every move in the lineup done today: +${LINEUP_BONUS} bonus!` : 'Posted to the squad feed.'}</p>
            <button ref={okRef} type="button" className="btn btn-primary" onClick={() => navigate(`/crew/${crewId}`)}>Back to today</button>
          </div>
        </div>
      )}
    </main>
  )
}
