import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AvatarPicker } from '../components/AvatarPicker'
import { cleanOldAvatars } from '../lib/avatar'
import { useAuth } from '../lib/auth'
import { GOAL_OPTIONS, THEME_OPTIONS } from '../lib/exercises'
import { errorText, supabase } from '../lib/supabase'

function toggle(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export function ProfileSetup() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [goals, setGoals] = useState<string[]>(profile?.goals ?? [])
  const [themes, setThemes] = useState<string[]>(profile?.gif_themes ?? [])
  const [bioPublic, setBioPublic] = useState(profile?.bio_public ?? true)
  const [goalsPublic, setGoalsPublic] = useState(profile?.goals_public ?? false)
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!name.trim()) return setError('Add your name so your crew knows who you are.')
    setBusy(true)
    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: name.trim(), avatar_url: avatar, bio: bio.trim(), goals, gif_themes: themes, bio_public: bioPublic, goals_public: goalsPublic, onboarded: true })
      .eq('id', profile.id)
    setBusy(false)
    if (err) return setError(errorText(err))
    void cleanOldAvatars(profile.id, avatar)
    await refreshProfile()
    navigate('/', { replace: true })
  }

  return (
    <main className="screen">
      <div className="top"><span className="eyebrow">{profile?.onboarded ? 'Edit profile' : 'Welcome'}</span></div>
      <h1 style={{ fontSize: 26, marginBottom: 16 }}>Set up your profile</h1>
      <form className="stack" onSubmit={save}>
        <div>
          <label htmlFor="nm">Your name</label>
          <input id="nm" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </div>
        {profile && <AvatarPicker userId={profile.id} name={name} value={avatar} onChange={setAvatar} />}
        <div>
          <label htmlFor="bio">Bio <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Desk job, trying to move more. Will trash talk." />
        </div>
        <div>
          <span className="label" id="goals-l">Goals <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></span>
          <div className="chips" role="group" aria-labelledby="goals-l">
            {GOAL_OPTIONS.map((g) => (
              <button key={g} type="button" className="chip" aria-pressed={goals.includes(g)} onClick={() => setGoals(toggle(goals, g))}>{g}</button>
            ))}
          </div>
        </div>
        <div>
          <span className="label" id="themes-l">GIF themes you love</span>
          <div className="chips" role="group" aria-labelledby="themes-l">
            {THEME_OPTIONS.map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={themes.includes(t)} onClick={() => setThemes(toggle(themes, t))}>{t}</button>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: '6px 16px' }}>
          <div className="switch"><label htmlFor="bio-pub">Show my bio to everyone</label><input id="bio-pub" type="checkbox" checked={bioPublic} onChange={(e) => setBioPublic(e.target.checked)} /></div>
          <div className="switch"><label htmlFor="goals-pub">Show my goals to everyone</label><input id="goals-pub" type="checkbox" checked={goalsPublic} onChange={(e) => setGoalsPublic(e.target.checked)} /></div>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : profile?.onboarded ? 'Save' : 'Next'}</button>
      </form>
    </main>
  )
}
