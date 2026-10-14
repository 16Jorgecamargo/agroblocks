import { render, screen } from '@testing-library/react'
import { FarmView } from '@/render/FarmView'
import { makeState } from '@/game/testing/makeState'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

describe('FarmView', () => {
  const props = {
    state: makeState(['. .']),
    lastEvents: [],
    eventKey: 0,
    stepDurationMs: 500,
    highlightCells: [],
    failed: false,
    seedKey: 'test',
  }

  it('uses the 2D grid when 2D mode is selected', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: '2d' } })
    render(<FarmView {...props} />)
    expect(screen.getByRole('grid', { name: 'Mapa da fazenda' })).toBeInTheDocument()
  })

  it('falls back to 2D with a notice when WebGL is unavailable', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: 'auto' } })
    render(<FarmView {...props} />)
    expect(screen.getByRole('grid', { name: 'Mapa da fazenda' })).toBeInTheDocument()
    expect(screen.getByText(/3D não está disponível/)).toBeInTheDocument()
  })

  it('announces the robot description for screen readers', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: '2d' } })
    render(<FarmView {...props} />)
    expect(screen.getByText(/Robô na coluna 1, linha 1/)).toHaveAttribute('aria-live', 'polite')
  })
})
