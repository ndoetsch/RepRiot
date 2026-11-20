import { Media } from '../components/Media'
import type { Channel } from './types'

/** The move's own GIF or clip, so you can follow the form. */
export const form: Channel = {
  id: 'form',
  name: 'Form guide',
  emoji: '🎯',
  blurb: "The move's animation, so you nail the form",
  shelf: 'Move',
  View: ({ exercise }) => (
    <div className="media">
      <Media exercise={exercise} />
    </div>
  ),
}
