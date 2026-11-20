import { isOn } from '../config/features'
import { load, save } from './store'
import { languageName, pickVoice } from './voices'

const KEY = 'readAloud'

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
}

export const readAloud = {
  available: () => isOn('readAloud') && synth() !== null,
  get: () => load<boolean>(KEY, false),
  set: (on: boolean) => {
    save(KEY, on)
    if (!on) stopSpeaking()
  },
}

// Phones load their voice list late (Chrome) or only after a tap (iPhone), so keep it fresh.
let voices: SpeechSynthesisVoice[] = []
function refreshVoices() {
  const s = synth()
  if (s) voices = s.getVoices()
}

/** A message for the screen when something can't be read out loud, or null. */
let problem: string | null = null
const listeners = new Set<() => void>()
const changed = () => listeners.forEach((fn) => fn())
export function onSpeechProblem(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export const speechProblem = () => problem

function setProblem(p: string | null) {
  if (p !== problem) {
    problem = p
    changed()
  }
}

function isApple(): boolean {
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
}

function noVoiceMessage(lang: string): string {
  const name = languageName(lang)
  return isApple()
    ? `This phone has no ${name} voice yet. Add one in Settings → Accessibility → Spoken Content → Voices → ${name}.`
    : `This phone has no ${name} voice yet. Add one in Settings → search "Text-to-speech" → install voice data → ${name}.`
}

/**
 * iPhone only lets a page talk after the person taps something. The first tap
 * anywhere plays a silent word, which unlocks speech for the rest of the visit.
 * Call once at startup.
 */
export function prepareSpeech() {
  const s = synth()
  if (!s) return
  refreshVoices()
  s.addEventListener?.('voiceschanged', refreshVoices)
  const unlock = () => {
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    s.speak(u)
    refreshVoices()
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('keydown', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}

/** Reads text out loud in the given language, with the best matching voice. */
export function speak(text: string, lang = 'en-US'): void {
  const s = synth()
  if (!s || !isOn('readAloud')) return
  if (!voices.length) refreshVoices()
  const voice = pickVoice(voices, lang)
  // No voice list at all usually means it's still loading: let the browser choose.
  if (voices.length && !voice) {
    setProblem(noVoiceMessage(lang))
    return
  }
  setProblem(null)
  const u = new SpeechSynthesisUtterance(text)
  u.lang = voice?.lang ?? lang
  if (voice) u.voice = voice
  u.rate = lang.startsWith('en') ? 0.95 : 0.85
  u.onerror = (e) => {
    if (e.error === 'not-allowed') setProblem('Tap 🔊 to hear it. Your phone needs a tap before it can talk.')
  }
  const wasBusy = s.speaking || s.pending
  s.cancel()
  s.resume()
  // Safari sometimes drops a word spoken right after cancel(), so give it a beat.
  if (wasBusy) setTimeout(() => s.speak(u), 60)
  else s.speak(u)
}

export function stopSpeaking(): void {
  synth()?.cancel()
}
