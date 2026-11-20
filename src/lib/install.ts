// Installing the app to the home screen. Chrome, Edge and Android hand us an
// install prompt we can show from our own button; iPhone needs a short guide.
import { useEffect, useState } from 'react'
import { isIOS, isInstalled } from './push'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallPrompt | null = null
let installedNow = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

/** Call once at startup, before the browser offers its prompt. */
export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPrompt
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installedNow = true
    notify()
  })
}

export type Platform = 'ios' | 'android' | 'desktop'

export function platform(): Platform {
  if (isIOS()) return 'ios'
  if (/Android/i.test(navigator.userAgent)) return 'android'
  return 'desktop'
}

/** The link to send friends: opens the app with the install guide ready. */
export function shareLink(): string {
  return `${window.location.origin}/?install`
}

export function useInstall() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const fn = () => rerender((n) => n + 1)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])
  return {
    installed: installedNow || isInstalled(),
    /** True when the browser will show its own install window. */
    canPrompt: deferred !== null,
    platform: platform(),
    /** Shows the browser's install window. Resolves true if the person said yes. */
    async prompt(): Promise<boolean> {
      if (!deferred) return false
      const e = deferred
      deferred = null
      await e.prompt()
      const { outcome } = await e.userChoice
      notify()
      return outcome === 'accepted'
    },
  }
}
