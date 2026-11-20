import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './index.css'
import { AuthProvider, pendingInvite, useAuth } from './lib/auth'
import { lastCrew } from './lib/crew'
import { registerServiceWorker } from './lib/push'
import { listenForInstall } from './lib/install'
import { prepareSpeech } from './channels/speech'
import { isConfigured } from './lib/supabase'
import { Loading } from './components/Loading'
import { SetupNeeded } from './pages/SetupNeeded'
import { Welcome } from './pages/Welcome'
import { EmailAuth } from './pages/EmailAuth'
import { ProfileSetup } from './pages/ProfileSetup'
import { Crews } from './pages/Crews'
import { Join } from './pages/Join'
import { Bring } from './pages/Bring'
import { Today } from './pages/Today'
import { DoIt } from './pages/DoIt'
import { Chat } from './pages/Chat'
import { Leaders } from './pages/Leaders'
import { Feed } from './pages/Feed'
import { CrewInfo } from './pages/CrewInfo'
import { Challenges } from './pages/Challenges'
import { Discover } from './pages/Discover'
import { isOn } from './config/features'

/** Only for signed-in people who have finished their profile. */
function Private({ children, allowUnfinished = false }: { children: ReactNode; allowUnfinished?: boolean }) {
  const { loading, session, profile } = useAuth()
  const location = useLocation()
  if (loading || (session && !profile)) return <Loading />
  if (!session) return <Navigate to="/" replace state={{ from: location.pathname }} />
  if (!profile?.onboarded && !allowUnfinished) return <Navigate to="/setup" replace />
  return <>{children}</>
}

function Start() {
  const { loading, session, profile } = useAuth()
  if (loading || (session && !profile)) return <Loading />
  if (!session) return <Welcome />
  if (!profile?.onboarded) return <Navigate to="/setup" replace />
  const invite = pendingInvite.get()
  if (invite) return <Navigate to={`/join/${invite}`} replace />
  const last = lastCrew.get()
  return <Navigate to={last ? `/crew/${last}` : '/crews'} replace />
}

function App() {
  if (!isConfigured) return <SetupNeeded />
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/email" element={<EmailAuth />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/setup" element={<Private allowUnfinished><ProfileSetup /></Private>} />
      <Route path="/crews" element={<Private><Crews /></Private>} />
      {isOn('publicSquads') && <Route path="/discover" element={<Private><Discover /></Private>} />}
      <Route path="/crew/:crewId" element={<Private><Today /></Private>} />
      <Route path="/crew/:crewId/bring" element={<Private><Bring /></Private>} />
      <Route path="/crew/:crewId/do/:exerciseId" element={<Private><DoIt /></Private>} />
      <Route path="/crew/:crewId/feed" element={<Private><Feed /></Private>} />
      <Route path="/crew/:crewId/leaders" element={<Private><Leaders /></Private>} />
      <Route path="/crew/:crewId/challenges" element={<Private><Challenges /></Private>} />
      {isOn('chat') && <Route path="/crew/:crewId/chat" element={<Private><Chat /></Private>} />}
      <Route path="/crew/:crewId/crew" element={<Private><CrewInfo /></Private>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

registerServiceWorker()
listenForInstall()
prepareSpeech()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <App />
        </div>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
