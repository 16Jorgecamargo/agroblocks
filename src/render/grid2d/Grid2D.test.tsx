import { render, screen } from '@testing-library/react'
import { Grid2D } from '@/render/grid2d/Grid2D'
import { makeState } from '@/game/testing/makeState'

describe('Grid2D', () => {
  it('renders one labelled cell per grid position with the robot marked', () => {
    render(<Grid2D state={makeState(['. mw', '# R'], { x: 1, y: 0, facing: 'S' })} highlightCells={[[0, 0]]} failed={false} />)
    expect(screen.getAllByRole('gridcell')).toHaveLength(4)
    expect(screen.getByRole('gridcell', { name: /coluna 2, linha 1: planta madura, solo molhado, robô virado para o Sul/ })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: /coluna 1, linha 1: solo sem preparo, solo seco, objetivo/ })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: /coluna 2, linha 2: reservatório de água/ })).toBeInTheDocument()
  })
})
