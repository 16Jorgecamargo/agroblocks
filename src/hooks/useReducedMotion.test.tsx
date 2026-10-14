import { renderHook, act } from '@testing-library/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia
}

describe('useReducedMotion', () => {
  beforeEach(() => useSettingsStore.setState({ settings: DEFAULT_SETTINGS }))

  it('follows the system preference by default', () => {
    mockMatchMedia(true)
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true)
  })

  it('lets the user force reduced or full motion', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    act(() => useSettingsStore.getState().update({ motion: 'reduced' }))
    expect(result.current).toBe(true)
    mockMatchMedia(true)
    act(() => useSettingsStore.getState().update({ motion: 'full' }))
    expect(result.current).toBe(false)
  })
})
