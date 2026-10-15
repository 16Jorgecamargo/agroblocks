import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSettingsStore } from '@/stores/settingsStore'

export function useMotionPrefs(): { reduced: boolean; decorative: boolean; ambient: boolean } {
  const reduced = useReducedMotion()
  const lowGraphics = useSettingsStore((store) => store.settings.lowGraphics)
  return { reduced, decorative: !reduced, ambient: !reduced && !lowGraphics }
}
