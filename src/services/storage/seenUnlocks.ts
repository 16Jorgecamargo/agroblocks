import { z } from 'zod'
import { readJson, writeJson } from '@/services/storage/jsonStorage'

export const SEEN_UNLOCKS_KEY = 'agroblocks:seen-unlocks:v1'

const schema = z.array(z.string())

export function loadSeenUnlocks(storage: Storage | null): string[] {
  return readJson(storage, SEEN_UNLOCKS_KEY, schema).value ?? []
}

export function saveSeenUnlocks(storage: Storage | null, ids: string[]): void {
  writeJson(storage, SEEN_UNLOCKS_KEY, ids)
}
