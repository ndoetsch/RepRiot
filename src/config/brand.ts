/**
 * Everything that makes RepRiot look and sound like RepRiot.
 * Rename or restyle the app by editing this one file (plus the colors in index.css).
 */
export const BRAND = {
  name: 'RepRiot',
  tagline: 'The app that makes moving the most entertaining part of your day.',
  pitch: 'A playful rebellion against boring workouts.',
  /** What the app calls a group, its exercises, and the shared set of exercises. */
  words: {
    group: 'squad',
    Group: 'Squad',
    groups: 'squads',
    move: 'move',
    lineup: 'lineup',
  },
  storagePrefix: 'repriot',
} as const

/** Keys for things the app remembers on this phone. */
export const storageKey = (name: string) => `${BRAND.storagePrefix}.${name}`
