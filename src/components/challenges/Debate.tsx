import { useState, type FormEvent } from 'react'
import { errorText, supabase } from '../../lib/supabase'
import type { ChallengeComment, Profile } from '../../lib/types'

/** The squad's back-and-forth on a challenge: haggling over a gauntlet, or trash talk on a dare. */
export function Debate({ challengeId, comments, members, meId, prompt, onPosted }: {
  challengeId: string
  comments: ChallengeComment[]
  members: Profile[]
  meId: string
  prompt: string
  onPosted: () => void
}) {
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameOf = (id: string) => (id === meId ? 'You' : members.find((m) => m.id === id)?.display_name ?? 'Someone')

  async function post(e: FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.from('challenge_comments').insert({ challenge_id: challengeId, user_id: meId, body: body.trim() })
    setBusy(false)
    if (err) return setError(errorText(err))
    setBody('')
    onPosted()
  }

  return (
    <div className="debate">
      {comments.length > 0 && (
        <ul className="debate-list">
          {comments.map((c) => (
            <li key={c.id}><b>{nameOf(c.user_id)}:</b> {c.body}</li>
          ))}
        </ul>
      )}
      <form className="row" onSubmit={post} style={{ marginTop: 8 }}>
        <input type="text" aria-label={prompt} placeholder={prompt} value={body} maxLength={500} onChange={(e) => setBody(e.target.value)} />
        <button type="submit" className="btn btn-ghost btn-sm" disabled={busy || !body.trim()}>Post</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
