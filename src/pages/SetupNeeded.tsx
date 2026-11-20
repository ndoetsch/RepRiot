import { Logo } from '../components/Logo'

export function SetupNeeded() {
  return (
    <main className="screen center">
      <div style={{ margin: '40px auto 16px' }}>
        <Logo width={96} />
      </div>
      <h1 style={{ fontSize: 28 }}>Fitluck</h1>
      <p className="muted">Almost ready. The app is waiting for its database keys.</p>
      <p className="small muted">
        Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (see <code>.env.example</code>), then reload.
      </p>
    </main>
  )
}
