import { describeCell, describeRobot } from '@/render/cellDescription'
import { makeState } from '@/game/testing/makeState'

describe('cellDescription', () => {
  it('describes soil with plot state and moisture', () => {
    expect(describeCell({ terrain: 'soil', plot: 'growing', moisture: 'wet', growth: 0 })).toBe('planta em crescimento, solo molhado')
    expect(describeCell({ terrain: 'soil', plot: 'untilled', moisture: 'dry', growth: 0 })).toBe('solo sem preparo, solo seco')
  })

  it('describes non-soil terrain', () => {
    expect(describeCell({ terrain: 'reservoir', plot: 'untilled', moisture: 'dry', growth: 0 })).toBe('reservatório de água')
    expect(describeCell({ terrain: 'obstacle', plot: 'untilled', moisture: 'dry', growth: 0 })).toBe('pedra (obstáculo)')
  })

  it('describes the robot position, facing and current plot using 1-based coordinates', () => {
    expect(describeRobot(makeState(['. m'], { x: 1, facing: 'S' }))).toBe(
      'Robô na coluna 2, linha 1, virado para o Sul (para baixo). Canteiro atual: planta madura, solo seco.',
    )
  })
})
