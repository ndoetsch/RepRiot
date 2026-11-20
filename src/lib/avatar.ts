import { supabase } from './supabase'

/** Fun icons people can use instead of a photo. Stored as "icon:🦁". */
export const AVATAR_ICONS = ['🦁', '🐯', '🐻', '🐺', '🦊', '🐸', '🦍', '🦖', '🐙', '🦄', '🐼', '🦅', '🔥', '⚡', '💪', '🚀', '👑', '🤖', '👽', '💀', '🥊', '🏀', '🍕', '🌮']

export function iconOf(url: string | null | undefined): string | null {
  return url?.startsWith('icon:') ? url.slice(5) : null
}

const SIZE = 320

/** Crops a photo to a centered square and shrinks it, so uploads are small and fast. */
async function squareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("That photo couldn't be opened. Try a JPG or PNG.")
  })
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("This browser can't resize photos.")
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("That photo couldn't be processed."))), 'image/jpeg', 0.85),
  )
}

/** Uploads a new profile photo and returns its public address. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Pick a photo, not a video or file.')
  const blob = await squareJpeg(file)
  const path = `${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

/** Removes old uploaded photos, keeping the one in use. Failures are harmless. */
export async function cleanOldAvatars(userId: string, keepUrl: string | null) {
  const { data } = await supabase.storage.from('avatars').list(userId)
  const old = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => !keepUrl?.endsWith(p))
  if (old.length) await supabase.storage.from('avatars').remove(old)
}
