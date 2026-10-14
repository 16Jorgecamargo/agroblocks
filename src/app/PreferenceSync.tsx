import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

export function PreferenceSync() {
  const theme = useSettingsStore((state) => state.settings.theme)
  const motion = useSettingsStore((state) => state.settings.motion)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (motion === 'system') delete document.documentElement.dataset.motion
    else document.documentElement.dataset.motion = motion
  }, [motion])

  return null
}
