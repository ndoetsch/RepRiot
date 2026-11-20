import { storageKey } from '../config/brand'

/** Small helpers for remembering channel choices and progress on this phone. */
export function load<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(name))
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(name: string, value: unknown): void {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(value))
  } catch {
    /* private mode or storage full: nothing to do */
  }
}
