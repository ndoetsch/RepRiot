/**
 * Everything that makes the app look and sound like itself.
 * Rename the app or the mascot by editing this one file. The page title,
 * home screen name, welcome logo text and reminders all follow it.
 * (Colors live at the top of src/index.css; the raccoon pictures are
 * public/logo.svg, public/wordmark-art.svg and the PNGs in public/icons.)
 */

/** The app name in two parts: the second part is drawn in green on the logo. */
const NAME_PARTS = ['Rep', 'Rascal'] as const

export const BRAND = {
  name: NAME_PARTS.join(''),
  nameParts: NAME_PARTS,
  tagline: 'The app that makes moving the most entertaining part of your day.',
  pitch: 'A playful rebellion against boring workouts.',
  /** The raccoon mascot. Change the name here and it changes everywhere. */
  mascot: {
    name: 'Reppy',
    fullName: 'Reppy the Raccoon',
  },
  /** What the app calls a group, its exercises, and the shared set of exercises. */
  words: {
    group: 'squad',
    Group: 'Squad',
    groups: 'squads',
    move: 'move',
    lineup: 'lineup',
  },
  /** Prefix for things the app remembers on this phone. Changing it forgets them. */
  storagePrefix: 'reprascal',
} as const

/** Keys for things the app remembers on this phone. */
export const storageKey = (name: string) => `${BRAND.storagePrefix}.${name}`
