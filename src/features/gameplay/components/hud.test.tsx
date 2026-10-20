import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { RollingNumber } from '@/components/game/RollingNumber'
import { GameHud } from '@/features/gameplay/components/GameHud'
import { HarvestFlights } from '@/features/gameplay/components/HarvestFlights'
import { getMission } from '@/data/missions'
import { useFlightStore } from '@/stores/flightStore'
import { locateCell } from '@/render/cellLocator'
import { Grid2D } from '@/render/grid2d/Grid2D'
import { makeState } from '@/game/testing/makeState'

describe('animated HUD', () => {
  it('exposes the real value of a rolling number to assistive tech', () => {
    const { container } = render(<RollingNumber value="12" />)
    expect(container.querySelector('.visually-hidden')).toHaveTextContent('12')
    expect(container.querySelectorAll('.rolling-number__column')).toHaveLength(2)
  })

  it('marks low and empty resources', () => {
    const efficient = getMission('homestead-10')
    if (!efficient) throw new Error('missing')
    render(<GameHud mission={efficient} resources={{ seeds: 1, water: 0, energy: 70, harvested: 0 }} onHelp={vi.fn()} onSettings={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByLabelText('Sementes: 1')).toHaveAttribute('data-level', 'low')
    expect(screen.getByLabelText('Água: 0')).toHaveAttribute('data-level', 'empty')
    expect(screen.getByLabelText('Energia: 70')).toHaveAttribute('data-level', 'ok')
    expect(screen.queryByLabelText(/^Colheita/)).not.toBeInTheDocument()
  })

  it('shows only the harvest chip in a harvest-only mission', () => {
    const harvest = getMission('greenhouse-03')
    if (!harvest) throw new Error('missing')
    render(<GameHud mission={harvest} resources={{ seeds: null, water: null, energy: null, harvested: 2 }} onHelp={vi.fn()} onSettings={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByLabelText('Colheita: 2')).toHaveAttribute('data-flight-target', 'harvest')
    expect(screen.queryByLabelText(/^Sementes/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Água/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Energia/)).not.toBeInTheDocument()
  })

  it('flies harvested fruit and lands it', async () => {
    render(<HarvestFlights />)
    act(() => useFlightStore.getState().launch({ x: 10, y: 10 }, { x: 200, y: 20 }))
    expect(document.querySelectorAll('.harvest-flight')).toHaveLength(1)
    const before = useFlightStore.getState().arrivals
    await waitFor(() => expect(useFlightStore.getState().arrivals).toBe(before + 1), { timeout: 3000 })
    expect(document.querySelectorAll('.harvest-flight')).toHaveLength(0)
  })

  it('registers the 2D grid as the cell locator', () => {
    const { unmount } = render(<Grid2D state={makeState(['. .'])} highlightCells={[]} failed={false} />)
    expect(locateCell(1, 0)).not.toBeNull()
    unmount()
    expect(locateCell(1, 0)).toBeNull()
  })
})
