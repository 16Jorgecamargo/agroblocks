import { createRandom } from '@/render/seededRandom'
import { rectDistance } from '@/render/world/geometry'
import { CLUTTER_CEILING, edgeClutter, landmark, reliefMounds } from '@/render/world/landscapes/landscapeKit'
import { isClutter } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Rect, Vec2 } from '@/render/world/worldTypes'

const open = (keepOut: Vec2[][] = []) => new WorldDraft(createRandom(7), { grid: null, paths: [], river: null, keepOut, frontGuard: null })

const inRect = (point: Vec2, rect: Rect) => point.x >= rect.minX && point.x <= rect.maxX && point.z >= rect.minZ && point.z <= rect.maxZ

describe('landscape kit', () => {
  it('keeps clutter on the outside edges of blocks, fewer in light graphics', () => {
    const blocks = [
      { minX: -10, maxX: -5, minZ: -3, maxZ: 3 },
      { minX: 0, maxX: 4, minZ: -3, maxZ: 3 },
      { minX: 8, maxX: 12, minZ: -3, maxZ: 3 },
    ]
    for (const [density, ceiling] of [['full', 18], ['light', 9]] as const) {
      const draft = open()
      edgeClutter(draft, blocks, density, createRandom(4))
      const clutter = draft.props.filter((prop) => isClutter(prop.model))
      expect(clutter.length).toBeGreaterThan(0)
      expect(clutter.length).toBeLessThanOrEqual(ceiling)
      for (const prop of clutter) for (const block of blocks) expect(inRect(prop, block)).toBe(false)
    }
    expect(CLUTTER_CEILING).toEqual({ map: 60, farm: 80 })
  })

  it('raises low hills only around the core of a rolling world', () => {
    const core = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 }
    const bounds = { minX: -15, maxX: 15, minZ: -15, maxZ: 15 }
    const mounds = reliefMounds('rolling', core, bounds, createRandom(5))
    expect(mounds.length).toBeGreaterThanOrEqual(6)
    for (const mound of mounds) {
      expect(rectDistance(mound, core)).toBeGreaterThan(mound.radius)
      expect(inRect(mound, bounds)).toBe(true)
    }
    expect(reliefMounds('flat', core, bounds, createRandom(5))).toEqual([])
    expect(reliefMounds('terraced', core, bounds, createRandom(5))).toEqual([])
  })

  it('places a landmark by hand, even where scattering is not allowed', () => {
    const zone = [{ x: -2, z: -2 }, { x: 2, z: -2 }, { x: 2, z: 2 }, { x: -2, z: 2 }]
    const draft = open([zone])
    landmark(draft, 'silo', { x: 0, z: 0 }, 0)
    landmark(draft, 'hayBale', { x: 1, z: 0 }, 0.5, 1.2)
    expect(draft.props).toEqual([{ model: 'silo', x: 0, z: 0, rotation: 0, scale: 1 }])
    expect(draft.features).toEqual([{ kind: 'hayBale', x: 1, z: 0, rotation: 0.5, scale: 1.2 }])
  })
})
