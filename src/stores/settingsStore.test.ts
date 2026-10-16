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

  it('turns music and sound effects on at every start, even if they were switched off before', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ musicEnabled: true, soundEnabled: true })
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, musicEnabled: false, soundEnabled: false, lowGraphics: true }))
    expect(loadSettings(window.localStorage)).toMatchObject({ musicEnabled: true, soundEnabled: true, lowGraphics: true })
  })

  it('drops the old 2D view preference', () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ renderMode: '2d' }))
    expect(loadSettings(window.localStorage)).not.toHaveProperty('renderMode')
  })

  it('persists updates', () => {
    useSettingsStore.getState().update({ lowGraphics: true, defaultSpeed: 2 })
    expect(useSettingsStore.getState().settings.lowGraphics).toBe(true)
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? '{}')).toMatchObject({ lowGraphics: true, defaultSpeed: 2 })
  })
})
