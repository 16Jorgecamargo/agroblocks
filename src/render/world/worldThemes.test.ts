import { WORLD_STYLES } from '@/render/world/worldStyles'
import { WORLD_IDS } from '@/game/worlds/worldTypes'
import { buildWorld } from '@/render/world/buildWorld'
import { GRID_CLEARANCE } from '@/render/world/worldCatalog'
import { WORLD_COLORS } from '@/render/world/worldPalette'

describe('world themes', () => {
  it('keeps the current look without a theme', () => {
    const world = buildWorld({ layout: 'farm', gridWidth: 6, gridHeight: 3, seed: 's', density: 'full', theme: null })
    expect(world.features).toEqual([])
    expect(world.palette.grass).toBe(WORLD_COLORS.grass)
  })

  it.each(WORLD_IDS)('%s farm takes its own palette', (theme) => {
    const world = buildWorld({ layout: 'farm', gridWidth: 6, gridHeight: 3, seed: 's', density: 'full', theme })
    expect(world.features.length).toBeGreaterThan(0)
    expect(world.palette).toEqual(WORLD_STYLES[theme].palette)
  })

  it('keeps features off the playable grid', () => {
    const world = buildWorld({ layout: 'farm', gridWidth: 6, gridHeight: 3, seed: 's', density: 'full', theme: 'cornfield' })
    for (const feature of world.features) expect(Math.abs(feature.x) > 3 + GRID_CLEARANCE || Math.abs(feature.z) > 1.5 + GRID_CLEARANCE).toBe(true)
  })

  it('keeps features apart from props and from each other', () => {
    const world = buildWorld({ layout: 'farm', gridWidth: 6, gridHeight: 3, seed: 's', density: 'full', theme: 'orchard' })
    for (const [index, feature] of world.features.entries()) {
      for (const other of world.features.slice(index + 1)) expect(Math.hypot(feature.x - other.x, feature.z - other.z)).toBeGreaterThan(0.3)
    }
  })
})
