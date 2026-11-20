import { BRAND } from '../config/brand'

/** The app logo. To change it, replace public/logo.svg (and the PNGs in public/icons). */
export function Logo({ width = 112 }: { width?: number }) {
  return <img src="/logo.svg" width={width} height={width} alt={`${BRAND.name} logo`} />
}
