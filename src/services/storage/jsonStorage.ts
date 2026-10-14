import type { z } from 'zod'

export function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function readJson<T>(
  storage: Storage | null,
  key: string,
  schema: z.ZodType<T>,
): { value: T | null; corrupt: boolean; raw: string | null } {
  if (!storage) return { value: null, corrupt: false, raw: null }
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return { value: null, corrupt: false, raw: null }
  }
  if (raw === null) return { value: null, corrupt: false, raw: null }
  try {
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? { value: parsed.data, corrupt: false, raw } : { value: null, corrupt: true, raw }
  } catch {
    return { value: null, corrupt: true, raw }
  }
}

export function writeJson(storage: Storage | null, key: string, value: unknown): boolean {
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
