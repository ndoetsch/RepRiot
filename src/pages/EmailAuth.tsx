import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Back } from '../components/Back'
import { useAuth } from '../lib/auth'
import { errorText, supabase } from '../lib/supabase'

export function EmailAuth() {
  const { session } = useAuth()
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    setBusy(true)
    const res =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
        : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (res.error) return setError(errorText(res.error))
    if (mode === 'signup' && !res.data.session) setCheckEmail(true)
  }

  if (checkEmail) {
    return (
      <main className="screen">
        <div className="top"><Back to="/" /><span /></div>
        <h1 style={{ fontSize: 26 }}>Check your email</h1>
        <p className="muted">We sent a link to <b>{email}</b>. Tap it to finish signing up, then come back here.</p>
      </main>
    )
  }

  return (
    <main className="screen">
      <div className="top"><Back to="/" /><span className="eyebrow">{mode === 'signup' ? 'Create account' : 'Sign in'}</span><span style={{ width: 44 }} /></div>
      <form className="stack" onSubmit={submit}>
        <div>
          <label htmlFor="em">Email</label>
          <input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
        <button type="button" className="link-btn" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
          {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      </form>
    </main>
  )
}
