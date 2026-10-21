import { buildWorld } from '@/render/world/buildWorld'
import { buildOccupancy } from '@/render/world/navigation/buildOccupancy'
import { occupantAt } from '@/render/world/navigation/occupancy'

describe('build occupancy', () => {
  it('blocks the barn, fences, troughs and trail markers on the barnyard map', () => {
    const world = buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'barnyard', density: 'full', theme: 'barnyard' })
    const grid = buildOccupancy(world)
    expect(occupantAt(grid, world.props.find((prop) => prop.model === 'barn')!)).toBe('structure')
    for (const node of world.trail) expect(occupantAt(grid, node)).toBe('marker')
    expect(occupantAt(grid, world.features.find((feature) => feature.kind === 'trough')!)).toBe('feed')
    expect(world.props.filter((prop) => prop.model === 'fence').every((fence) => occupantAt(grid, fence) === 'fence')).toBe(true)
  })

  it('blocks the mission grid on a farm scene', () => {
    const world = buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'garden-01', density: 'full', theme: 'garden' })
    expect(world.missionGrid).toEqual({ minX: -2.5, maxX: 2.5, minZ: -1.5, maxZ: 1.5 })
    expect(occupantAt(buildOccupancy(world), { x: 0, z: 0 })).toBe('missionGrid')
  })

  it('is the same grid on every build', () => {
    const make = () => buildOccupancy(buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'garden', density: 'full', theme: 'garden' }))
    expect(make().cells).toEqual(make().cells)
  })
})
