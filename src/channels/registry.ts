import { isOn } from '../config/features'
import { GREEK_GODS } from './content/greekGods'
import { FRENCH, SPANISH } from './content/languages'
import { form } from './form'
import { jokes } from './jokes'
import { news } from './news'
import { sports } from './sports'
import { load, save } from './store'
import { trackChannel } from './track'
import type { Channel } from './types'
import { video } from './video'

/**
 * Every channel, in picker order. To add a new one, write it (or a list of
 * cards for trackChannel) and add it here. Nothing else needs to change.
 */
const ALL: Channel[] = [
  form,
  video,
  trackChannel({ id: 'greek-gods', name: 'Greek gods', emoji: '⚡', blurb: 'Meet a new god or hero every set', shelf: 'Learn', cards: GREEK_GODS }),
  trackChannel({ id: 'spanish', name: 'Spanish', emoji: '🇪🇸', blurb: 'One handy phrase per set', shelf: 'Learn', cards: SPANISH }),
  trackChannel({ id: 'french', name: 'French', emoji: '🇫🇷', blurb: 'One handy phrase per set', shelf: 'Learn', cards: FRENCH }),
  jokes,
  news,
  sports,
]

export function channels(): Channel[] {
  return ALL.filter((c) => !c.feature || isOn(c.feature))
}

export function channelById(id: string): Channel {
  return channels().find((c) => c.id === id) ?? form
}

const KEY = 'channel'
export const favoriteChannel = {
  get: () => load<string>(KEY, form.id),
  set: (id: string) => save(KEY, id),
}
