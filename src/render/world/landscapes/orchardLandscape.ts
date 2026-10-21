import { cropBlock, landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { composeFarm, composeMap } from '@/render/world/landscapes/scaffold'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { GroundPatch, Rect, Vec2 } from '@/render/world/worldTypes'

const TERRACE = '#5f9e44'
const YARD = '#b9a77e'
const RED = '#e0473c'
const ORANGE = '#f29a2e'
const YELLOW = '#f2c94c'

function terrace(draft: WorldDraft, rect: Rect, height: number, tint: string, random: () => number): GroundPatch {
  const patch = cropBlock(draft, { rect, color: TERRACE, height }, 'fruitTree', [1.9, 1.9], random, { tints: [tint], jitter: 0.05 })
  const tree = draft.features.find((feature) => feature.kind === 'fruitTree' && feature.y === height && feature.x >= rect.minX && feature.x <= rect.maxX && feature.z >= rect.minZ && feature.z <= rect.maxZ)
  if (tree) draft.forceFeature('orchardLadder', { x: tree.x + 0.7, z: tree.z + 0.5 }, 0.8, 1, undefined, height)
  return patch
}

function packingYard(draft: WorldDraft, at: Vec2, frontCrates: Vec2[]): GroundPatch {
  landmark(draft, 'packingShed', at, 0)
  landmark(draft, 'crateStack', { x: at.x + 1.9, z: at.z - 0.6 }, 0.2)
  landmark(draft, 'crateStack', { x: at.x - 1.9, z: at.z + 0.4 }, -0.3)
  for (const point of frontCrates) landmark(draft, 'crateStack', point, 0.5)
  return { rect: { minX: at.x - 2.8, maxX: at.x + 2.8, minZ: at.z - 1.6, maxZ: at.z + 1.8 }, color: YARD }
}

export const orchardLandscape: Landscape = {
  map: (input, random) =>
    composeMap('orchard', input, random, ({ draft }) => {
      const blocks: [Rect, number, string][] = [
        [{ minX: -4.6, maxX: -0.4, minZ: -4.6, maxZ: 1 }, 0.75, RED],
        [{ minX: 0.4, maxX: 5, minZ: -4.6, maxZ: 0.6 }, 0.5, ORANGE],
        [{ minX: -2.4, maxX: 5, minZ: 1.8, maxZ: 6.2 }, 0.25, YELLOW],
        [{ minX: 8, maxX: 11.6, minZ: -11.4, maxZ: -7.6 }, 0.25, RED],
        [{ minX: 9.8, maxX: 13.6, minZ: 9.8, maxZ: 13.6 }, 0.25, ORANGE],
        [{ minX: -13.6, maxX: -9.8, minZ: -13.6, maxZ: -9.8 }, 0.5, YELLOW],
        [{ minX: -13.6, maxX: -10, minZ: 9.4, maxZ: 13.6 }, 0.25, RED],
      ]
      const patches = blocks.map(([rect, height, tint]) => terrace(draft, rect, height, tint, random))
      patches.push(packingYard(draft, { x: -9, z: 2.6 }, [{ x: -6.6, z: 4.6 }]))
      return { patches, blocks: blocks.map(([rect]) => rect), butterflies: blocks.map(([rect]) => ({ x: (rect.minX + rect.maxX) / 2, z: (rect.minZ + rect.maxZ) / 2 })), paths: [{ points: [{ x: -8.4, z: 4.6 }, { x: -8.1, z: 6.2 }, { x: -7.9, z: 7.2 }], width: 0.9 }] }
    }),
  farm: (input, random) =>
    composeFarm('orchard', input, random, ({ draft, hw, hh }) => {
      const blocks: [Rect, number, string][] = [
        [{ minX: -hw - 7.6, maxX: -hw - 1.8, minZ: -hh - 0.4, maxZ: hh + 1.4 }, 0.4, RED],
        [{ minX: -hw - 0.4, maxX: hw + 3.8, minZ: -hh - 7.6, maxZ: -hh - 1.8 }, 0.4, ORANGE],
        [{ minX: hw + 4.6, maxX: hw + 8.4, minZ: -hh - 7.6, maxZ: -hh - 3.6 }, 0.7, YELLOW],
      ]
      const patches = blocks.map(([rect, height, tint]) => terrace(draft, rect, height, tint, random))
      patches.push(packingYard(draft, { x: -hw - 5.2, z: -hh - 5.4 }, [{ x: hw + 3, z: hh + 2.4 }]))
      return { patches, blocks: blocks.map(([rect]) => rect) }
    }),
}
