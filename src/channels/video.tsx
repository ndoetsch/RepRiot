import { Media } from '../components/Media'
import type { Channel } from './types'

/** A real-person demo. Plays the squad's own clip when there is one, or opens a demo search. */
export const video: Channel = {
  id: 'video',
  name: 'Demo video',
  emoji: '🎬',
  blurb: 'Watch a real person do the move',
  shelf: 'Move',
  View: ({ exercise }) => {
    const isClip = exercise.media_type === 'upload' && !exercise.media_url.endsWith('.gif')
    if (isClip) {
      return (
        <div className="media">
          <Media exercise={exercise} />
        </div>
      )
    }
    const search = `https://www.youtube.com/results?search_query=${encodeURIComponent(`how to do ${exercise.name} proper form`)}`
    return (
      <div className="channel-card">
        <span className="eyebrow">🎬 Demo video</span>
        <h2 className="channel-title">{exercise.name}</h2>
        <p className="channel-body">There's no clip uploaded for this move yet. Open a demo, watch it once, then come back and crush the set.</p>
        <a className="btn btn-ghost" href={search} target="_blank" rel="noreferrer" style={{ marginTop: 'auto' }}>Open demo videos</a>
      </div>
    )
  },
}
