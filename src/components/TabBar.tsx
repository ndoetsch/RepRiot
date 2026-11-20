import { NavLink } from 'react-router-dom'

const icon = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

export function TabBar({ crewId }: { crewId: string }) {
  return (
    <nav className="tabs" aria-label="Main">
      <div className="tabs-inner">
        <NavLink to={`/crew/${crewId}`} end>
          <svg {...icon}><path d="M4 20h4v-6H4zM10 20h4V9h-4zM16 20h4V4h-4z" /></svg>
          Today
        </NavLink>
        <NavLink to={`/crew/${crewId}/feed`}>
          <svg {...icon}><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="2.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M15.5 14.6c2.6-.3 5 1.4 5.8 5.4" /></svg>
          Feed
        </NavLink>
        <NavLink to={`/crew/${crewId}/leaders`}>
          <svg {...icon}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></svg>
          Leaders
        </NavLink>
        <NavLink to={`/crew/${crewId}/chat`}>
          <svg {...icon}><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z" /></svg>
          Chat
        </NavLink>
        <NavLink to={`/crew/${crewId}/crew`}>
          <svg {...icon}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" /></svg>
          Crew
        </NavLink>
      </div>
    </nav>
  )
}
