import { BRAND } from '../config/brand'
import { supabase } from './supabase'

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
export const DEFAULT_HOURS = [10, 13, 16]

export const pushConfigured = Boolean(VAPID)

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Opened from the home screen, as an installed app. */
export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Reminders just won't be available.
    })
  }
}

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  return (await reg?.pushManager.getSubscription()) ?? null
}

export type ReminderPrefs = { enabled: boolean; hours: number[]; tz: string }

export async function loadPrefs(userId: string): Promise<ReminderPrefs | null> {
  const { data, error } = await supabase.from('reminder_prefs').select('enabled, hours, tz').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data as ReminderPrefs | null
}

export async function savePrefs(userId: string, prefs: Partial<ReminderPrefs>) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const { error } = await supabase
    .from('reminder_prefs')
    .upsert({ user_id: userId, tz, ...prefs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

/** Asks for permission, then saves this phone so reminders can reach it. */
export async function turnOn(userId: string, hours: number[]): Promise<void> {
  if (!VAPID) throw new Error('Reminders are not set up on the server yet.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error(`Notifications are blocked. Turn them on for ${BRAND.name} in your phone settings, then try again.`)
  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID) }))
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
    { onConflict: 'endpoint', ignoreDuplicates: true },
  )
  if (error) throw error
  await savePrefs(userId, { enabled: true, hours })
}

export async function turnOff(userId: string): Promise<void> {
  const sub = await currentSubscription()
  if (sub) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
  await savePrefs(userId, { enabled: false })
}
