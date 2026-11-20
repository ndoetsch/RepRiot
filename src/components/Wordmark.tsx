import { BRAND } from '../config/brand'

/**
 * The welcome logo: the raccoon art with the app name written beside it.
 * The name comes from src/config/brand.ts, and shrinks to fit if it gets longer.
 */
export function Wordmark({ width = 320 }: { width?: number }) {
  const [first, second] = BRAND.nameParts
  const room = 220
  const fontSize = Math.min(50, Math.floor(room / (BRAND.name.length * 0.62)))
  return (
    <svg viewBox="0 0 360 112" width={width} role="img" aria-label={BRAND.name} style={{ maxWidth: '100%', height: 'auto' }}>
      <image href="/wordmark-art.svg" width="360" height="112" />
      <text x="120" y="72" fontFamily="Inter, Arial, sans-serif" fontWeight={900} fontStyle="italic" fontSize={fontSize} fill="#fff" letterSpacing="-1">
        {first}
        <tspan fill="#83E600">{second}</tspan>
      </text>
    </svg>
  )
}
