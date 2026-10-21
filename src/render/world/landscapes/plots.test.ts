import { createRandom } from '@/render/seededRandom'
import { bedPlot, edgeSides } from '@/render/world/landscapes/plots'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Rect } from '@/render/world/worldTypes'

const road = { points: [{ x: -10, z: 0 }, { x: 10, z: 0 }], width: 1.2 }
const draft = () => new WorldDraft(createRandom(3), { grid: null, paths: [road], river: null, keepOut: [], frontGuard: null })

describe('plots', () => {
  it('lays beds in aligned rows, mixing crops and stages, inside the plot and off the road', () => {
    const plan = draft()
    const rect: Rect = { minX: -6, maxX: 2, minZ: -1.6, maxZ: 5 }
    const patch = bedPlot(plan, rect, createRandom(4), { crops: ['cabbageBed', 'carrotBed', 'tomatoBed'] })
    expect(patch.rect).toEqual(rect)
    expect(plan.features.length).toBeGreaterThan(10)
    expect(new Set(plan.features.map((bed) => bed.kind)).size).toBe(3)
    expect(new Set(plan.features.map((bed) => bed.rotation))).toEqual(new Set([0]))
    expect(new Set(plan.features.map((bed) => bed.z)).size).toBeGreaterThan(2)
    for (const bed of plan.features) {
      expect(bed.x >= rect.minX && bed.x <= rect.maxX && bed.z >= rect.minZ && bed.z <= rect.maxZ).toBe(true)
      expect(Math.abs(bed.z)).toBeGreaterThan(0.6 + 0.8 * bed.scale - 0.01)
    }
  })

  it('turns the beds when the rows run along z', () => {
    const plan = draft()
    bedPlot(plan, { minX: 2, maxX: 6, minZ: 2, maxZ: 9 }, createRandom(4), { crops: ['herbBed'], along: 'z' })
    expect(new Set(plan.features.map((bed) => bed.rotation))).toEqual(new Set([Math.PI / 2]))
  })

  it('edges only the chosen sides and leaves a gap', () => {
    const plan = draft()
    edgeSides(plan, 'hedge', { minX: 0, maxX: 6, minZ: 3, maxZ: 8 }, ['minX', 'minZ'], 0.45, [{ x: -0.45, z: 5.5 }])
    const hedges = plan.features.filter((feature) => feature.kind === 'hedge')
    expect(hedges.length).toBeGreaterThan(8)
    expect(hedges.every((hedge) => Math.abs(hedge.x + 0.45) < 0.01 || Math.abs(hedge.z - 2.55) < 0.01)).toBe(true)
    expect(hedges.some((hedge) => Math.hypot(hedge.x + 0.45, hedge.z - 5.5) < 1)).toBe(false)
  })
})
