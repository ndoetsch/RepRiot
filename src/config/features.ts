/**
 * Feature switches. Turn a feature off here, or for one deployment with the
 * VITE_FEATURES_OFF environment variable, e.g. VITE_FEATURES_OFF=publicSquads,chat
 *
 * New, unfinished features can be added with `false` and switched on when ready.
 */
const DEFAULTS = {
  /** Let organizers open their squad to strangers, and let people browse public squads. */
  publicSquads: true,
  /** Play alone, no squad needed. */
  solo: true,
  /** Group-voted gauntlets. */
  gauntlets: true,
  /** Open dares anyone in the squad can opt into. */
  openChallenges: true,
  /** Classic points races and squad goals, carried over from Fitluck. */
  classicChallenges: true,
  chat: true,
  reminders: true,
  /** Read text channels (jokes, lessons, news) out loud while you move. */
  readAloud: true,
} satisfies Record<string, boolean>

export type Feature = keyof typeof DEFAULTS

const off = new Set(
  String(import.meta.env.VITE_FEATURES_OFF ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
)

export function isOn(feature: Feature): boolean {
  return DEFAULTS[feature] && !off.has(feature)
}
