import { transitionFor } from '@/app/routeTransitions'

describe('transitionFor', () => {
  it('opens a mission from the map with an iris', () => {
    expect(transitionFor('/missoes', '/jogar/m1-first-harvest')).toBe('iris')
  })

  it('pushes back from a mission to the map', () => {
    expect(transitionFor('/jogar/m1-first-harvest', '/missoes')).toBe('push')
  })

  it('uses a blur crossfade everywhere else', () => {
    expect(transitionFor('/', '/missoes')).toBe('blurCrossfade')
    expect(transitionFor('/jogar/m1-first-harvest', '/resultado/m1-first-harvest')).toBe('blurCrossfade')
    expect(transitionFor('/', '/')).toBe('blurCrossfade')
  })
})
