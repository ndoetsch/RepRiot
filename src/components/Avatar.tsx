import { iconOf } from '../lib/avatar'
import { colorFor } from '../lib/format'
import type { Profile } from '../lib/types'

export function Avatar({ profile, size = 40 }: { profile: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>; size?: number }) {
  const initial = (profile.display_name || '?').trim().charAt(0).toUpperCase()
  const icon = iconOf(profile.avatar_url)
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: icon ? 'var(--primary-soft)' : colorFor(profile.id), fontSize: icon ? size * 0.55 : Math.max(13, size * 0.38) }}
      aria-hidden="true"
    >
      {icon ? icon : profile.avatar_url ? <img src={profile.avatar_url} alt="" referrerPolicy="no-referrer" /> : initial}
    </span>
  )
}
