import { useSyncExternalStore } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function systemPrefersReduced(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches
}

export function useReducedMotion(): boolean {
  const motion = useSettingsStore((state) => state.settings.motion)
  const system = useSyncExternalStore(subscribe, systemPrefersReduced, () => false)
  if (motion === 'reduced') return true
  if (motion === 'full') return false
  return system
}
