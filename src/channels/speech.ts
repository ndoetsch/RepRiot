import { isOn } from '../config/features'
import { load, save } from './store'

const KEY = 'readAloud'

export const readAloud = {
  available: () => isOn('readAloud') && typeof window !== 'undefined' && 'speechSynthesis' in window,
  get: () => load<boolean>(KEY, false),
  set: (on: boolean) => {
    save(KEY, on)
    if (!on) stopSpeaking()
  },
}

export function speak(text: string, lang = 'en-US'): void {
  if (!readAloud.available()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.95
  synth.speak(u)
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
}
