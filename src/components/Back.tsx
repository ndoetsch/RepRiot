import { useNavigate } from 'react-router-dom'

export function Back({ to }: { to?: string }) {
  const navigate = useNavigate()
  return (
    <button type="button" className="back" aria-label="Back" onClick={() => (to ? navigate(to) : navigate(-1))}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}
