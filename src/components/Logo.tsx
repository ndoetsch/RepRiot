import { BRAND } from '../config/brand'

/** The app logo. To change it, replace public/logo.png (and the PNGs in public/icons). */
export function Logo({ width = 112 }: { width?: number }) {
  return <img src="/logo.png" width={width} height={width} alt={`${BRAND.name} logo: ${BRAND.mascot.fullName}`} style={{ borderRadius: width * 0.22 }} />
}
