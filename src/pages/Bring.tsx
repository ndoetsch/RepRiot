import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Back } from '../components/Back'
import { GifPicker, type ChosenMedia } from '../components/GifPicker'
import { Loading } from '../components/Loading'
import { useAuth } from '../lib/auth'
import { lastCrew, useCrew } from '../lib/crew'
import { LIBRARY, type LibraryExercise } from '../lib/exercises'
import { exerciseLabel } from '../lib/format'
import { errorText, supabase } from '../lib/supabase'
import type { Exercise } from '../lib/types'

const SWAP_DAYS = 30

function swapOpensOn(e: Exercise): Date | null {
  const d = new Date(e.created_at)
  d.setDate(d.getDate() + SWAP_DAYS)
  return d > new Date() ? d : null
}

export function Bring() {
  const { crewId = '' } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { data, error: loadError } = useCrew(crewId)

  const [step, setStep] = useState<1 | 2>(1)
  const [picked, setPicked] = useState<LibraryExercise | null>(LIBRARY[0])
  const [custom, setCustom] = useState(false)
  const [name, setName] = useState(LIBRARY[0].name)
  const [mode, setMode] = useState<'reps' | 'seconds'>(LIBRARY[0].mode)
  const [amount, setAmount] = useState(LIBRARY[0].amount)
  const [tutorial, setTutorial] = useState(LIBRARY[0].tutorial)
  const [modifier, setModifier] = useState(LIBRARY[0].modifier)
  const [media, setMedia] = useState<ChosenMedia | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loadError) return <main className="screen"><p className="error">{loadError}</p><Link to="/crews">Back to my crews</Link></main>
  if (!data || !profile) return <Loading />

  const mine = data.exercises.find((e) => e.user_id === profile.id)
  const locked = mine ? swapOpensOn(mine) : null
  const taken = data.exercises.filter((e) => e.user_id !== profile.id).map((e) => e.name)

  if (mine && locked) {
    return (
      <main className="screen">
        <div className="top"><Back to={`/crew/${crewId}`} /><span /></div>
        <h1 style={{ fontSize: 24 }}>You're bringing {exerciseLabel(mine)}</h1>
        <p className="muted">You can keep it or swap it once a month. Your next swap opens {locked.toLocaleDateString([], { month: 'long', day: 'numeric' })}.</p>
        <Link to={`/crew/${crewId}`} className="btn btn-primary push">Back to today</Link>
      </main>
    )
  }

  function choose(ex: LibraryExercise | null) {
    setPicked(ex)
    setCustom(!ex)
    if (ex) {
      setName(ex.name)
      setMode(ex.mode)
      setAmount(ex.amount)
      setTutorial(ex.tutorial)
      setModifier(ex.modifier)
    } else {
      setName('')
      setMode('reps')
      setAmount(10)
      setTutorial('')
      setModifier('')
    }
    setMedia(null)
  }

  function changeMode(m: 'reps' | 'seconds') {
    setMode(m)
    setAmount(m === 'seconds' ? 30 : 10)
  }

  function bump(dir: number) {
    const step = mode === 'seconds' ? 5 : 1
    setAmount((a) => Math.min(60, Math.max(step, a + dir * step)))
  }

  async function save() {
    if (!media || !profile) return
    setBusy(true)
    setError(null)
    if (mine) {
      const { error: offErr } = await supabase.from('potluck_exercises').update({ active: false }).eq('id', mine.id)
      if (offErr) {
        setBusy(false)
        return setError(errorText(offErr))
      }
    }
    const { error: err } = await supabase.from('potluck_exercises').insert({
      crew_id: crewId,
      user_id: profile.id,
      name: name.trim(),
      mode,
      amount,
      tutorial: tutorial.trim(),
      modifier: modifier.trim(),
      ...media,
    })
    setBusy(false)
    if (err) return setError(errorText(err))
    lastCrew.set(crewId)
    navigate(`/crew/${crewId}`, { replace: true })
  }

  const summary =
    mode === 'seconds' ? `3 sets of ${amount} seconds a day` : `3 sets of ${amount} ${(name || 'reps').toLowerCase()} a day`

  if (step === 2) {
    return (
      <main className="screen">
        <div className="top"><button type="button" className="back" aria-label="Back" onClick={() => setStep(1)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg></button><span className="eyebrow">Step 2 of 2</span><span style={{ width: 44 }} /></div>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Pick its GIF</h1>
        <p className="muted small" style={{ margin: '0 0 14px' }}>Required. Everyone in {data.crew.name} sees this while doing {name || 'your exercise'}.</p>
        <GifPicker userId={profile.id} initialQuery={picked?.gifSearch ?? name} value={media} onChange={setMedia} />
        {error && <p className="error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} disabled={!media || busy} onClick={save}>
          {busy ? 'Saving…' : 'Bring it to the potluck'}
        </button>
      </main>
    )
  }

  return (
    <main className="screen">
      <div className="top"><Back to={mine ? `/crew/${crewId}` : '/crews'} /><span className="eyebrow">Step 1 of 2</span><span style={{ width: 44 }} /></div>
      <h1 style={{ fontSize: 24, marginBottom: 6 }}>{mine ? 'Swap your exercise' : 'What are you bringing?'}</h1>
      <p className="muted small" style={{ margin: '0 0 14px' }}>One exercise for {data.crew.name}, 1 minute or less a set, 3 sets a day. You can swap it once a month.</p>

      <label htmlFor="ex-pick">Exercise</label>
      <select
        id="ex-pick"
        value={custom ? '__custom' : picked?.name}
        onChange={(e) => choose(e.target.value === '__custom' ? null : LIBRARY.find((x) => x.name === e.target.value) ?? null)}
        style={{ width: '100%', minHeight: 46, borderRadius: 12, border: '1px solid var(--line)', padding: '0 12px', font: 'inherit', background: '#fff' }}
      >
        {LIBRARY.map((x) => (
          <option key={x.name} value={x.name}>{x.name}{taken.includes(x.name) ? ' (already brought)' : ''}</option>
        ))}
        <option value="__custom">Something else (custom)</option>
      </select>
      {custom && (
        <div style={{ marginTop: 12 }}>
          <label htmlFor="ex-name">Name it</label>
          <input id="ex-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Desk push-ups" />
        </div>
      )}
      {taken.length > 0 && <p className="small muted">Already brought: {taken.join(', ')}</p>}

      <div className="card" style={{ marginTop: 12 }}>
        <div className="seg" role="group" aria-label="Count by">
          <button type="button" aria-pressed={mode === 'reps'} onClick={() => changeMode('reps')}>Reps</button>
          <button type="button" aria-pressed={mode === 'seconds'} onClick={() => changeMode('seconds')}>Seconds</button>
        </div>
        <div className="counter">
          <button type="button" onClick={() => bump(-1)} aria-label="Less">−</button>
          <span className="big" aria-live="polite">{mode === 'seconds' ? `${amount}s` : amount}</span>
          <button type="button" onClick={() => bump(1)} aria-label="More">+</button>
        </div>
        <p className="small muted center" style={{ margin: 0 }}>{summary}{mode === 'seconds' ? ' (max 60)' : ''}</p>
      </div>

      <div className="card stack" style={{ marginTop: 12 }}>
        <div>
          <label htmlFor="tut">Quick tutorial <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <textarea id="tut" value={tutorial} onChange={(e) => setTutorial(e.target.value)} maxLength={300} />
        </div>
        <div>
          <label htmlFor="mod">One modifier <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <input id="mod" type="text" value={modifier} onChange={(e) => setModifier(e.target.value)} maxLength={80} placeholder="Easier: knees on the floor" />
        </div>
      </div>

      <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} disabled={!name.trim()} onClick={() => setStep(2)}>
        Next: pick its GIF
      </button>
    </main>
  )
}
