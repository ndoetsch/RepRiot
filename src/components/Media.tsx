import type { Exercise } from '../lib/types'

type Props = {
  exercise: Pick<Exercise, 'media_type' | 'media_url' | 'media_still_url' | 'media_title'>
  /** Play the animation (true) or show a still frame (false). */
  playing?: boolean
}

/** Shows an exercise's GIF from Giphy or the person's own uploaded clip. */
export function Media({ exercise, playing = true }: Props) {
  const { media_type, media_url, media_still_url, media_title } = exercise
  if (media_type === 'upload' && !media_url.endsWith('.gif')) {
    return <video src={media_url} autoPlay={playing} loop muted playsInline aria-label={media_title || 'Exercise clip'} />
  }
  const src = !playing && media_still_url ? media_still_url : media_url
  return <img src={src} alt={media_title || 'Exercise GIF'} />
}
