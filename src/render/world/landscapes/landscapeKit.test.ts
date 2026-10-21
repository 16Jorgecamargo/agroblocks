import { createRandom } from '@/render/seededRandom'
import { rectDistance } from '@/render/world/geometry'
import { borderBelt, CLUTTER_CEILING, cropBlock, edgeClutter, landmark, reliefMounds } from '@/render/world/landscapes/landscapeKit'
import { isClutter, TREE_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Rect, Vec2 } from '@/render/world/worldTypes'

const open = (keepOut: Vec2[][] = []) => new WorldDraft(createRandom(7), { grid: null, paths: [], river: null, keepOut, frontGuard: null })

function perimeterDistance(point: Vec2, rect: Rect): number {
  const inside = point.x >= rect.minX && point.x <= rect.maxX && point.z >= rect.minZ && point.z <= rect.maxZ
  if (!inside) return rectDistance(point, rect)
  return Math.min(point.x - rect.minX, rect.maxX - point.x, point.z - rect.minZ, rect.maxZ - point.z)
}

const inRect = (point: Vec2, rect: Rect) => point.x >= rect.minX && point.x <= rect.maxX && point.z >= rect.minZ && point.z <= rect.maxZ

describe('landscape kit', () => {
  it('fills a crop block in rows, on its patch height', () => {
    const draft = open()
    const rect = { minX: 0, maxX: 5, minZ: 0, maxZ: 4 }
    const patch = cropBlock(draft, { rect, color: '#b99a4b', height: 0.5 }, 'cornStalk', [0.8, 1], createRandom(1))
    expect(patch).toEqual({ rect, color: '#b99a4b', height: 0.5 })
    expect(draft.features.length).toBeGreaterThanOrEqual(15)
    for (const feature of draft.features) {
      expect(inRect(feature, rect)).toBe(true)
      expect(feature.y).toBe(0.5)
    }
  })

  it('walks the border around a rect and leaves room where a path goes out', () => {
    const draft = open()
    const rect = { minX: -6, maxX: 6, minZ: -4, maxZ: 4 }
    const gap = { x: 0, z: 4 }
    borderBelt(draft, 'hedge', rect, createRandom(2), [gap])
    expect(draft.features.length).toBeGreaterThan(30)
    for (const feature of draft.features) {
      expect(feature.kind).toBe('hedge')
      expect(perimeterDistance(feature, rect)).toBeLessThanOrEqual(0.3)
      expect(Math.hypot(feature.x - gap.x, feature.z - gap.z)).toBeGreaterThan(1.2)
    }
  })

  it('mixes four kinds of border, one per side', () => {
    const draft = open()
    borderBelt(draft, 'mixed', { minX: -6, maxX: 6, minZ: -6, maxZ: 6 }, createRandom(3))
    const kinds = new Set(draft.features.map((feature) => feature.kind))
    expect(kinds).toEqual(new Set(['hedge', 'stoneWall']))
    expect(draft.props.some((prop) => prop.model === 'fence')).toBe(true)
    expect(draft.props.some((prop) => (TREE_MODELS as readonly string[]).includes(prop.model))).toBe(true)
  })

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
