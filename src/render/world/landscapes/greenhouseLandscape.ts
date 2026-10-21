import { cropBlock, landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { center, composeFarm, composeMap, inset } from '@/render/world/landscapes/scaffold'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { GroundPatch, Rect, Vec2 } from '@/render/world/worldTypes'

const SOIL = '#8a6448'
const GRAVEL = '#d9d2c3'
const BAY = 3

function bayRow(draft: WorldDraft, start: Vec2, count: number): GroundPatch {
  for (let index = 0; index < count; index += 1) landmark(draft, 'greenhouseBay', { x: start.x + index * BAY, z: start.z }, 0)
  landmark(draft, 'supportShed', { x: start.x + count * BAY - 0.2, z: start.z }, 0)
  return { rect: { minX: start.x - 1.8, maxX: start.x + count * BAY + 1, minZ: start.z - 1.4, maxZ: start.z + 1.4 }, color: GRAVEL }
}

function seedlings(draft: WorldDraft, rect: Rect, random: () => number): GroundPatch {
  const patch = cropBlock(draft, { rect, color: SOIL }, 'vegetableBed', [1.9, 1.3], random, { jitter: 0 })
  const middle = center(rect)
  for (const dx of [-1, 1]) draft.forceFeature('sprinkler', { x: middle.x + dx * (rect.maxX - rect.minX) * 0.25, z: rect.maxZ + 0.35 }, random() * Math.PI, 1)
  return patch
}

export const greenhouseLandscape: Landscape = {
  map: (input, random) =>
    composeMap('greenhouse', input, random, ({ draft }) => {
      const beds: Rect[] = [
        { minX: -11.8, maxX: -6, minZ: -5.6, maxZ: 1.2 },
        { minX: -3.4, maxX: 1.6, minZ: 6.2, maxZ: 11 },
        { minX: 2.2, maxX: 5.4, minZ: -0.2, maxZ: 4.2 },
      ]
      const patches = beds.map((rect) => seedlings(draft, rect, random))
      patches.push(bayRow(draft, { x: -7.5, z: -9.4 }, 5))
      landmark(draft, 'waterTank', { x: -10.6, z: -9.6 }, 0)
      for (let index = 0; index < 2; index += 1) landmark(draft, 'greenhouseBay', { x: 11.6, z: 7 + index * BAY }, Math.PI / 2)
      patches.push({ rect: { minX: 10.2, maxX: 13, minZ: 5.2, maxZ: 11.8 }, color: GRAVEL })
      return { patches, blocks: [...beds, inset({ minX: -9.4, maxX: 8.6, minZ: -10.8, maxZ: -8 }, 0)], paths: [{ points: [{ x: 7.4, z: -7.9 }, { x: 6.2, z: -5.8 }, { x: 5.1, z: -4.2 }], width: 0.9 }] }
    }),
  farm: (input, random) =>
    composeFarm('greenhouse', input, random, ({ draft, hw, hh }) => {
      const beds: Rect[] = [{ minX: -hw - 7.2, maxX: -hw - 2, minZ: -hh - 0.4, maxZ: hh + 3.2 }]
      const patches = beds.map((rect) => seedlings(draft, rect, random))
      patches.push(bayRow(draft, { x: -hw - 0.6, z: -hh - 5.4 }, 3))
      landmark(draft, 'waterTank', { x: -hw - 5.2, z: -hh - 5.6 }, 0)
      patches.push({ rect: { minX: -hw - 6.4, maxX: -hw - 4, minZ: -hh - 6.8, maxZ: -hh - 4.4 }, color: GRAVEL })
      return { patches, blocks: beds }
    }),
}
