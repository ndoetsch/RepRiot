import { useState } from 'react'
import { BRAND } from '../config/brand'
import { RULES } from '../config/rules'
import { errorText, supabase } from '../lib/supabase'
import type { Crew } from '../lib/types'

/** The organizer's controls: private or public, the member cap, and the public description. */
export function SquadSettings({ crew, memberCount, onSaved }: { crew: Crew; memberCount: number; onSaved: () => void }) {
  const [open, setOpen] = useState(crew.is_public)
  const [cap, setCap] = useState(crew.max_members)
  const [description, setDescription] = useState(crew.description)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const maxCap = open ? RULES.maxPublicSquad : RULES.maxPrivateSquad
  const minCap = Math.max(2, memberCount)
  const changed = open !== crew.is_public || cap !== crew.max_members || description.trim() !== crew.description

  function setPublic(on: boolean) {
    setOpen(on)
    if (!on) setCap((c) => Math.min(c, RULES.maxPrivateSquad))
  }

  async function save() {
    setBusy(true)
    setError(null)
    setMsg(null)
    const { error: err } = await supabase.from('crews').update({ is_public: open, max_members: cap, description: description.trim() }).eq('id', crew.id)
    setBusy(false)
    if (err) return setError(errorText(err))
    setMsg('Saved.')
    onSaved()
  }

  const privateTooBig = !open && memberCount > RULES.maxPrivateSquad

  return (
    <div className="card stack" style={{ marginTop: 12 }}>
      <b>Organizer settings</b>
      <div className="switch">
        <label htmlFor="sq-public">Public: anyone can find and join</label>
        <input id="sq-public" type="checkbox" checked={open} onChange={(e) => setPublic(e.target.checked)} />
      </div>
      <div>
        <span className="label" id="sq-cap">Max people</span>
        <div className="counter" style={{ margin: '4px 0' }}>
          <button type="button" onClick={() => setCap((c) => Math.max(minCap, c - 1))} aria-label="Fewer people">−</button>
          <span className="big" aria-live="polite" aria-labelledby="sq-cap">{cap}</span>
          <button type="button" onClick={() => setCap((c) => Math.min(maxCap, c + 1))} aria-label="More people">+</button>
        </div>
        <p className="small muted center" style={{ margin: 0 }}>
          {open ? `Public ${BRAND.words.groups}: up to ${RULES.maxPublicSquad}.` : `Private ${BRAND.words.groups}: up to ${RULES.maxPrivateSquad}.`}
        </p>
      </div>
      {open && (
        <div>
          <label htmlFor="sq-desc">Description for strangers</label>
          <input id="sq-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        </div>
      )}
      {privateTooBig && <p className="error">This {BRAND.words.group} has {memberCount} people, more than a private one can hold. It has to stay public.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {msg && <p className="small" role="status" style={{ margin: 0 }}>{msg}</p>}
      <button type="button" className="btn btn-primary btn-sm" disabled={!changed || busy || privateTooBig} onClick={save}>{busy ? 'Saving…' : 'Save settings'}</button>
    </div>
  )
}
