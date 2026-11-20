import type { Exercise } from './types'

/** "10 Calf raises" or "30-second Plank". */
export function exerciseLabel(e: Pick<Exercise, 'name' | 'mode' | 'amount'>): string {
  return e.mode === 'seconds' ? `${e.amount}-second ${e.name}` : `${e.amount} ${e.name}`
}

const PALETTE = ['#15803D', '#1864AB', '#B45309', '#7048E8', '#C2255C', '#0B7285']

export function colorFor(id: string): string {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}
