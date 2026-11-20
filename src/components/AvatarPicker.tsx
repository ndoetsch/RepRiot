import { useRef, useState } from 'react'
import { AVATAR_ICONS, iconOf, uploadAvatar } from '../lib/avatar'
import { errorText } from '../lib/supabase'
import { Avatar } from './Avatar'

type Props = {
  userId: string
  name: string
  value: string | null
  onChange: (url: string | null) => void
}

export function AvatarPicker({ userId, name, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIcons, setShowIcons] = useState(Boolean(iconOf(value)))
  const isPhoto = Boolean(value && !iconOf(value))

  async function pickPhoto(file: File) {
    setBusy(true)
    setError(null)
    try {
      onChange(await uploadAvatar(userId, file))
      setShowIcons(false)
    } catch (e) {
      setError(errorText(e))
    }
    setBusy(false)
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <span className="label">Profile picture</span>
      <div className="row" style={{ gap: 14 }}>
        <Avatar profile={{ id: userId, display_name: name, avatar_url: value }} size={72} />
        <div className="stack" style={{ gap: 6, flex: 1 }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? 'Uploading…' : isPhoto ? 'Change photo' : 'Upload a photo'}
          </button>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} aria-expanded={showIcons} onClick={() => setShowIcons(!showIcons)}>
              Pick an icon
            </button>
            {value && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => onChange(null)}>
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void pickPhoto(f)
          e.target.value = ''
        }}
      />
      {showIcons && (
        <div className="icon-grid" role="group" aria-label="Icons">
          {AVATAR_ICONS.map((ic) => (
            <button key={ic} type="button" className="icon-pick" aria-pressed={value === `icon:${ic}`} aria-label={`Use ${ic}`} onClick={() => onChange(`icon:${ic}`)}>
              {ic}
            </button>
          ))}
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
