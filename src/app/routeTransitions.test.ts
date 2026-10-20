import { transitionFor } from '@/app/routeTransitions'

describe('transitionFor', () => {
  it('opens a mission from the map with an iris', () => {
    expect(transitionFor('/missoes', '/jogar/garden-04')).toBe('iris')
  })

  it('pushes back from a mission to the map', () => {
    expect(transitionFor('/jogar/garden-04', '/missoes')).toBe('push')
  })

  it('uses a blur crossfade everywhere else', () => {
    expect(transitionFor('/', '/missoes')).toBe('blurCrossfade')
    expect(transitionFor('/jogar/garden-04', '/resultado/garden-04')).toBe('blurCrossfade')
    expect(transitionFor('/', '/')).toBe('blurCrossfade')
  })
})
