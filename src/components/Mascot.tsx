import { BRAND } from '../config/brand'

/**
 * The welcome-screen logo: Reppy the Raccoon pumping a fist over the app name.
 * Two pictures stacked: the scene (public/mascot/scene.webp) and the arm on its
 * own layer (public/mascot/arm.webp), which CSS swings up and down.
 * The art includes the app's name, so a rename needs new pictures too.
 */
export function Mascot({ width = 300 }: { width?: number }) {
  return (
    <div className="mascot" style={{ width, maxWidth: '100%' }} role="img" aria-label={`${BRAND.mascot.fullName} pumping a fist over the ${BRAND.name} logo`}>
      <img src="/mascot/scene.webp" alt="" width={900} height={900} />
      <img src="/mascot/arm.webp" alt="" width={900} height={900} className="mascot-arm" />
    </div>
  )
}
