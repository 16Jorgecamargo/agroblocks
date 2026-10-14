import { create } from 'zustand'
import { safeStorage } from '@/services/storage/jsonStorage'
import { loadSettings, saveSettings, type Settings } from '@/services/storage/settingsStorage'

interface SettingsState {
  settings: Settings
  update: (patch: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(safeStorage()),
  update: (patch) => {
    const settings = { ...get().settings, ...patch }
    saveSettings(safeStorage(), settings)
    set({ settings })
  },
}))
