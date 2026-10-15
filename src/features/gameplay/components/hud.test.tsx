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

const mission = getMission('m5-limited-resources')
if (!mission) throw new Error('missing')

describe('animated HUD', () => {
  it('exposes the real value of a rolling number to assistive tech', () => {
    const { container } = render(<RollingNumber value="12" />)
    expect(container.querySelector('.visually-hidden')).toHaveTextContent('12')
    expect(container.querySelectorAll('.rolling-number__column')).toHaveLength(2)
  })

  it('marks low and empty resources', () => {
    render(<GameHud mission={mission} resources={{ seeds: 1, water: 0, energy: null, harvested: 0 }} onHelp={vi.fn()} onSettings={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByLabelText('Sementes: 1')).toHaveAttribute('data-level', 'low')
    expect(screen.getByLabelText('Água: 0')).toHaveAttribute('data-level', 'empty')
    expect(screen.getByLabelText('Energia: ilimitada')).toHaveAttribute('data-level', 'ok')
    expect(screen.getByLabelText('Colheita: 0')).toHaveAttribute('data-flight-target', 'harvest')
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
