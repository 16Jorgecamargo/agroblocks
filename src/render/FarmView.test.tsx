import { render, screen } from '@testing-library/react'
import { FarmView } from '@/render/FarmView'
import { makeState } from '@/game/testing/makeState'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

describe('FarmView', () => {
  const props = {
    growTicks: 3,
    state: makeState(['. .']),
    lastEvents: [],
    eventKey: 0,
    stepDurationMs: 500,
    highlightCells: [],
    failed: false,
    seedKey: 'test',
  }

  it('falls back to 2D with a notice only when WebGL is unavailable, ignoring an old 2D preference', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, ...({ renderMode: '2d' } as object) } })
    render(<FarmView {...props} />)
    expect(screen.getByRole('grid', { name: 'Mapa da fazenda' })).toBeInTheDocument()
    expect(screen.getByText(/3D não está disponível/)).toBeInTheDocument()
  })

  it('announces the robot description for screen readers', () => {
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS })
    render(<FarmView {...props} />)
    expect(screen.getByText(/Robô na coluna 1, linha 1/)).toHaveAttribute('aria-live', 'polite')
  })
})
