import { channels } from '../channels/registry'

/** A scrolling row of channels to pick what's on screen during a set. */
export function ChannelPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="channel-picker" role="radiogroup" aria-label="What to watch while you move">
      {channels().map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          className="channel-chip"
          title={c.blurb}
          onClick={() => onChange(c.id)}
        >
          <span aria-hidden="true">{c.emoji}</span> {c.name}
        </button>
      ))}
    </div>
  )
}
