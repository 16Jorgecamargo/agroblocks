import { render, screen } from '@testing-library/react'
import { useReducedMotionConfig } from 'motion/react'
import { MotionProvider } from '@/motion/MotionProvider'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

function Probe() {
  const reduced = useReducedMotionConfig()
  const prefs = useMotionPrefs()
  return <p>{`${String(reduced)}|${prefs.decorative}|${prefs.ambient}`}</p>
}

describe('MotionProvider', () => {
  it('runs full motion by default', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full' } })
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    )
    expect(screen.getByText('false|true|true')).toBeInTheDocument()
  })

  it('reduces motion and disables decorative effects when requested', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'reduced' } })
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    )
    expect(screen.getByText('true|false|false')).toBeInTheDocument()
  })

  it('keeps decorative effects but stops ambient loops in low graphics mode', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full', lowGraphics: true } })
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    )
    expect(screen.getByText('false|true|false')).toBeInTheDocument()
  })
})
