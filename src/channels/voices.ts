// Picking the right voice for a language. Kept free of browser globals so it can be tested.

export type VoiceLike = { lang: string; name: string; localService?: boolean; default?: boolean }

const norm = (lang: string) => lang.replace('_', '-').toLowerCase()

/** Voices that sound most natural, by name, best first. */
const PREFERRED = ['premium', 'enhanced', 'natural', 'google', 'siri']

/**
 * The best voice for a language like 'de-DE': same language and region first,
 * then the same language anywhere, preferring higher quality voices.
 * Returns null when the phone has no voice for that language.
 */
export function pickVoice<V extends VoiceLike>(voices: readonly V[], lang: string): V | null {
  const want = norm(lang)
  const base = want.split('-')[0]
  const score = (v: V) => {
    const l = norm(v.lang)
    if (l !== want && l.split('-')[0] !== base) return -1
    let s = l === want ? 100 : 50
    const name = v.name.toLowerCase()
    PREFERRED.forEach((p, i) => {
      if (name.includes(p)) s += 20 - i * 2
    })
    if (v.localService) s += 3
    if (v.default) s += 1
    return s
  }
  let best: V | null = null
  let bestScore = -1
  for (const v of voices) {
    const s = score(v)
    if (s > bestScore) {
      best = v
      bestScore = s
    }
  }
  return bestScore >= 0 ? best : null
}

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese' }

export function languageName(lang: string): string {
  return LANGUAGE_NAMES[norm(lang).split('-')[0]] ?? lang
}
