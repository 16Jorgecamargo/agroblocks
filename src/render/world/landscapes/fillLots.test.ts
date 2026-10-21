import { createRandom } from '@/render/seededRandom'
import { pointInPolygon } from '@/render/world/geometry'
import { fillLots, type LotRecipe } from '@/render/world/landscapes/fillLots'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Rect } from '@/render/world/worldTypes'

const recipe: LotRecipe = {
  kinds: ['furrows', 'youngCrop', 'stripes', 'stubble'],
  youngCrop: { feature: 'cornStalk', spacing: [0.7, 0.9], scale: 0.55 },
  pond: true,
  canal: true,
  vignettes: ['tractor', 'wheelbarrow'],
}

const lots: Rect[] = [
  { minX: -12, maxX: -6, minZ: -12, maxZ: -6 },
  { minX: -4, maxX: 2, minZ: -12, maxZ: -9 },
  { minX: 4, maxX: 10, minZ: -12, maxZ: -9 },
  { minX: -12, maxX: -9, minZ: 0, maxZ: 6 },
  { minX: 4, maxX: 10, minZ: 4, maxZ: 7 },
]

describe('fill lots', () => {
  it('gives every lot a purpose, one pond on the squarest lot, a canal, and work scenes', () => {
    const draft = new WorldDraft(createRandom(3), { grid: null, paths: [], river: null, keepOut: [], frontGuard: null })
    const filled = fillLots(draft, lots, recipe, '#7cc35a', createRandom(4))
    expect(filled.ponds).toHaveLength(1)
    const pond = filled.ponds[0]
    expect(pointInPolygon({ x: -9, z: -9 }, pond)).toBe(true)
    expect(filled.patches.length).toBe(lots.length - 1)
    const textures = new Set(filled.patches.map((patch) => patch.texture))
    expect(textures.has('furrows')).toBe(true)
    expect(textures.has('stripes')).toBe(true)
    expect(filled.canals.length).toBe(1)
    const young = draft.features.filter((feature) => feature.kind === 'cornStalk')
    expect(young.length).toBeGreaterThan(10)
    for (const stalk of young) expect(stalk.scale).toBe(0.55)
    expect(draft.features.some((feature) => feature.kind === 'tractor')).toBe(true)
    expect(draft.features.some((feature) => feature.kind === 'wheelbarrow')).toBe(true)
    expect(draft.features.some((feature) => feature.kind === 'pier')).toBe(true)
    for (const feature of draft.features.filter((item) => item.kind !== 'pier')) expect(pointInPolygon(feature, pond)).toBe(false)
  })

  it('works the same way every time', () => {
    const run = () => {
      const draft = new WorldDraft(createRandom(3), { grid: null, paths: [], river: null, keepOut: [], frontGuard: null })
      return { filled: fillLots(draft, lots, recipe, '#7cc35a', createRandom(4)), features: draft.features }
    }
    expect(run()).toEqual(run())
  })
})
