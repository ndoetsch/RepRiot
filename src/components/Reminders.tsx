import { useEffect, useState } from 'react'
import { errorText } from '../lib/supabase'
import { DEFAULT_HOURS, currentSubscription, isIOS, isInstalled, loadPrefs, pushConfigured, pushSupported, savePrefs, turnOff, turnOn } from '../lib/push'

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
const MAX_PICKS = 6

function hourLabel(h: number): string {
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr} ${h < 12 ? 'AM' : 'PM'}`
}

export function Reminders({ userId }: { userId: string }) {
  const [on, setOn] = useState<boolean | null>(null)
  const [hours, setHours] = useState<number[]>(DEFAULT_HOURS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let live = true
    Promise.all([loadPrefs(userId), currentSubscription()])
      .then(([prefs, sub]) => {
        if (!live) return
        if (prefs) setHours(prefs.hours)
        setOn(Boolean(prefs?.enabled && sub))
      })
      .catch((e) => {
        if (!live) return
        setOn(false)
        setError(errorText(e))
      })
    return () => {
      live = false
    }
  }, [userId])

  const needsInstall = isIOS() && !isInstalled()
  const unsupported = !pushSupported() && !needsInstall

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      if (on) await turnOff(userId)
      else await turnOn(userId, hours)
      setOn(!on)
    } catch (e) {
      setError(errorText(e))
    }
    setBusy(false)
  }

  async function pick(h: number) {
    const next = hours.includes(h) ? hours.filter((x) => x !== h) : [...hours, h].sort((a, b) => a - b)
    if (next.length > MAX_PICKS) return setError(`Up to ${MAX_PICKS} reminders a day.`)
    setError(null)
    setHours(next)
    if (!on) return
    try {
      await savePrefs(userId, { hours: next })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <section className="card stack" aria-labelledby="rem-h">
      <div className="row between">
        <h2 id="rem-h" style={{ fontSize: 16, margin: 0 }}>Your reminders</h2>
        {saved && <span className="small muted" role="status">Saved</span>}
      </div>
      {!pushConfigured ? (
        <p className="small muted" style={{ margin: 0 }}>Reminders are almost ready. They switch on once the app's notification keys are added.</p>
      ) : needsInstall ? (
        <p className="small" style={{ margin: 0 }}>
          On iPhone, reminders only work from the home screen app. In Safari, tap the Share button, then <b>Add to Home Screen</b>. Open Fitluck from there and come back here.
        </p>
      ) : unsupported ? (
        <p className="small muted" style={{ margin: 0 }}>This browser can't show reminders. Try Chrome on Android, or the home screen app on iPhone.</p>
      ) : (
        <>
          <p className="small muted" style={{ margin: 0 }}>
            A nudge at the times you pick, only on days you still have sets left. Never between 9 PM and 8 AM.
          </p>
          <div className="chips" role="group" aria-label="Reminder times">
            {HOURS.map((h) => (
              <button key={h} type="button" className="chip" aria-pressed={hours.includes(h)} onClick={() => void pick(h)}>{hourLabel(h)}</button>
            ))}
          </div>
          <button type="button" className={`btn ${on ? 'btn-ghost' : 'btn-primary'}`} disabled={busy || on === null || (!on && hours.length === 0)} onClick={() => void toggle()}>
            {busy ? 'One sec…' : on ? 'Turn reminders off' : 'Turn on reminders'}
          </button>
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}
