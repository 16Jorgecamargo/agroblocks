import { groundDetail } from '@/render/world/groundDetail'
import { WORLD_STYLES } from '@/render/world/worldStyles'
import type { World } from '@/render/world/worldTypes'

function world(overrides: Partial<World>): World {
  return {
    ground: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
    island: false,
    paths: [],
    river: null,
    trail: [],
    props: [],
    pasture: null,
    animals: [],
    butterflies: [],
    features: [],
    palette: WORLD_STYLES.garden.palette,
    style: WORLD_STYLES.garden,
    ...overrides,
  }
}

describe('ground detail', () => {
  it('draws nothing extra on plain ground', () => {
    expect(groundDetail(world({}))).toEqual({ texture: null, water: null, bank: null, ruts: null })
  })

  it('draws furrows and mown stripes as one mesh, standing on the lot', () => {
    const detail = groundDetail(
      world({
        patches: [
          { rect: { minX: 0, maxX: 4, minZ: 0, maxZ: 3 }, color: '#7a5a3a', texture: 'furrows' },
          { rect: { minX: -6, maxX: -2, minZ: 0, maxZ: 4 }, color: '#7cc35a', texture: 'stripes' },
        ],
      }),
    )
    const texture = detail.texture
    expect(texture).not.toBeNull()
    texture?.computeBoundingBox()
    expect(texture?.boundingBox?.min.x).toBeGreaterThanOrEqual(-6.01)
    expect(texture?.boundingBox?.max.x).toBeLessThanOrEqual(4.01)
    expect(texture?.boundingBox?.max.y).toBeLessThan(0.12)
    expect(texture?.attributes.color.count).toBe(texture?.attributes.position.count)
  })

  it('fills ponds with water inside a bank, and marks wheel ruts on roads', () => {
    const pond = [{ x: 0, z: 0 }, { x: 3, z: 0 }, { x: 3, z: 3 }, { x: 0, z: 3 }]
    const detail = groundDetail(world({ waters: [pond], paths: [{ points: [{ x: -8, z: 5 }, { x: 8, z: 5 }], width: 1.2 }] }))
    detail.water?.computeBoundingBox()
    detail.bank?.computeBoundingBox()
    expect(detail.water?.boundingBox?.max.x).toBeCloseTo(3, 1)
    expect(detail.bank?.boundingBox?.max.x).toBeGreaterThan(3)
    detail.ruts?.computeBoundingBox()
    expect(detail.ruts?.boundingBox?.min.z).toBeGreaterThan(4.4)
    expect(detail.ruts?.boundingBox?.max.z).toBeLessThan(5.6)
  })
})
