import * as sceneLayout from '@/render/sceneLayout'

describe('sceneLayout', () => {
  it('centers the grid on the origin', () => {
    expect(sceneLayout.cellToWorld(0, 0, 3, 3)).toEqual({ x: -1, z: -1 })
    expect(sceneLayout.cellToWorld(1, 1, 3, 3)).toEqual({ x: 0, z: 0 })
    expect(sceneLayout.cellToWorld(3, 0, 4, 1)).toEqual({ x: 1.5, z: 0 })
  })

  it('leaves decoration to the world builder', () => {
    expect(Object.keys(sceneLayout).sort()).toEqual(['FACING_YAW', 'cellToWorld'])
  })
})
