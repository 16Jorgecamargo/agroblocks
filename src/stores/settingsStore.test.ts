import { DEFAULT_SETTINGS, loadSettings, SETTINGS_KEY } from '@/services/storage/settingsStorage'
import { useSettingsStore } from '@/stores/settingsStore'

describe('settings', () => {
  it('falls back to defaults for missing or invalid data', () => {
    expect(loadSettings(window.localStorage)).toEqual(DEFAULT_SETTINGS)
    window.localStorage.setItem(SETTINGS_KEY, '"nope"')
    expect(loadSettings(window.localStorage)).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid fields and fills missing ones with defaults', () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lowGraphics: true }))
    expect(loadSettings(window.localStorage)).toEqual({ ...DEFAULT_SETTINGS, lowGraphics: true })
  })

  it('persists updates', () => {
    useSettingsStore.getState().update({ renderMode: '2d', defaultSpeed: 2 })
    expect(useSettingsStore.getState().settings.renderMode).toBe('2d')
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? '{}')).toMatchObject({ renderMode: '2d', defaultSpeed: 2 })
  })
})
