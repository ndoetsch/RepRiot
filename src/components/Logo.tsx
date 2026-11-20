import { BRAND } from '../config/brand'

/** The RepRiot bolt: a lightning strike breaking out of a hot gradient tile. */
export function Logo({ width = 112 }: { width?: number }) {
  return (
    <svg width={width} height={width} viewBox="0 0 112 112" role="img" aria-label={`${BRAND.name} logo`}>
      <defs>
        <linearGradient id="rr-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF2E7E" />
          <stop offset="1" stopColor="#FF8A00" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="104" height="104" rx="28" fill="url(#rr-logo)" />
      <path d="M62 14 L30 62 H52 L44 98 L82 44 H59 Z" fill="#fff" stroke="#1B1036" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="88" cy="22" r="5" fill="#fff" />
      <circle cx="22" cy="90" r="4" fill="#fff" />
      <path d="M86 78 l8 -3 M90 88 l9 1 M20 30 l-8 -3 M24 20 l-3 -8" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
