import { createRandom } from '@/render/seededRandom'
import { distanceToPolyline, rectDistance } from '@/render/world/geometry'
import { freeLots } from '@/render/world/landscapes/freeLots'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Rect } from '@/render/world/worldTypes'

const overlap = (a: Rect, b: Rect) => a.minX < b.maxX && b.minX < a.maxX && a.minZ < b.maxZ && b.minZ < a.maxZ

describe('free lots', () => {
  it('cuts the open ground into separate lots around fields, roads and objects', () => {
    const draft = new WorldDraft(createRandom(1), { grid: null, paths: [], river: null, keepOut: [], frontGuard: null })
    draft.force('silo', { x: 6, z: 6 }, 0, 1)
    const road = { points: [{ x: -14, z: 0 }, { x: 14, z: 0 }], width: 1.2 }
    const field = { rect: { minX: -12, maxX: -4, minZ: -12, maxZ: -4 }, color: '#000' }
    const area = { minX: -14, maxX: 14, minZ: -14, maxZ: 14 }
    const lots = freeLots(draft, [road], [field], area)
    expect(lots.length).toBeGreaterThanOrEqual(6)
    for (const [index, lot] of lots.entries()) {
      const width = lot.maxX - lot.minX
      const depth = lot.maxZ - lot.minZ
      expect(width * depth).toBeGreaterThanOrEqual(6)
      expect(Math.max(width, depth)).toBeLessThanOrEqual(7.3)
      expect(lot.minX >= area.minX && lot.maxX <= area.maxX && lot.minZ >= area.minZ && lot.maxZ <= area.maxZ).toBe(true)
      expect(overlap(lot, field.rect)).toBe(false)
      expect(rectDistance({ x: 6, z: 6 }, lot)).toBeGreaterThan(0.8)
      for (const corner of [{ x: lot.minX, z: lot.minZ }, { x: lot.maxX, z: lot.maxZ }, { x: lot.minX, z: lot.maxZ }, { x: lot.maxX, z: lot.minZ }]) expect(distanceToPolyline(corner, road.points)).toBeGreaterThan(0.6)
      for (const other of lots.slice(index + 1)) expect(overlap(lot, other)).toBe(false)
    }
  })
})
