import { z } from 'zod'
import { readJson, writeJson } from '@/services/storage/jsonStorage'

export const settingsSchema = z.object({
  soundEnabled: z.boolean(),
  musicEnabled: z.boolean(),
  motion: z.enum(['system', 'reduced', 'full']),
  lowGraphics: z.boolean(),
  renderMode: z.enum(['auto', '3d', '2d']),
  defaultSpeed: z.union([z.literal(0.5), z.literal(1), z.literal(2), z.literal(4)]),
  theme: z.enum(['light', 'dark']),
})

export type Settings = z.infer<typeof settingsSchema>

export const SETTINGS_KEY = 'agroblocks:settings:v1'

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  musicEnabled: false,
  motion: 'system',
  lowGraphics: false,
  renderMode: 'auto',
  defaultSpeed: 1,
  theme: 'light',
}

export function loadSettings(storage: Storage | null): Settings {
  const { value } = readJson(storage, SETTINGS_KEY, settingsSchema.partial())
  return { ...DEFAULT_SETTINGS, ...(value ?? {}) }
}

export function saveSettings(storage: Storage | null, settings: Settings): void {
  writeJson(storage, SETTINGS_KEY, settings)
}
