/**
 * Everything that makes the app look and sound like itself.
 * Rename the app or the mascot by editing this one file. The page title,
 * home screen name, share text and reminders all follow it.
 * (Colors live at the top of src/index.css. The pictures are public/logo.png,
 * public/icons/ and public/mascot/; the welcome art has the name drawn in,
 * so swap those pictures too if the app name changes.)
 */
export const BRAND = {
  name: 'RepRascal',
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
