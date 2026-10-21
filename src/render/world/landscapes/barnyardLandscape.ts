import { rectPolygon } from '@/render/world/geometry'
import { borderBelt, landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { center, composeFarm, composeMap, inset, nearestGap } from '@/render/world/landscapes/scaffold'
import { spawnHerd } from '@/render/world/scenery'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { AnimalSpawn, AnimalSpecies, GroundPatch, Rect, Vec2 } from '@/render/world/worldTypes'

const PADDOCK = '#8fcf63'
const YARD = '#b49a6a'
const STUBBLE = '#d9c682'

function paddock(draft: WorldDraft, rect: Rect, toward: Vec2, herd: [AnimalSpecies, number][], name: string, random: () => number): { patch: GroundPatch; animals: AnimalSpawn[]; area: Vec2[] } {
  borderBelt(draft, 'woodFence', rect, random, [nearestGap(rect, toward)])
  const middle = center(rect)
  draft.forceFeature('trough', { x: middle.x, z: rect.minZ + 0.9 }, 0, 1)
  const area = rectPolygon(inset(rect, 0.7))
  return { patch: { rect, color: PADDOCK }, animals: spawnHerd(random, area, herd, name, 0.9), area }
}

function barnCluster(draft: WorldDraft, at: Vec2, rotation: number): GroundPatch {
  landmark(draft, 'barn', at, rotation, 0.85)
  landmark(draft, 'silo', { x: at.x - 2.6, z: at.z - 1.2 }, 0, 0.85)
  landmark(draft, 'feedShed', { x: at.x + 2.8, z: at.z - 0.6 }, rotation)
  draft.forceFeature('baleStack', { x: at.x - 2.4, z: at.z + 1.9 }, 0.3, 1)
  draft.forceFeature('baleStack', { x: at.x + 2.6, z: at.z + 1.9 }, -0.2, 1)
  return { rect: { minX: at.x - 3.2, maxX: at.x + 3.4, minZ: at.z - 2.4, maxZ: at.z + 2.8 }, color: YARD }
}

export const barnyardLandscape: Landscape = {
  map: (input, random) =>
    composeMap('barnyard', input, random, ({ draft }) => {
      const left = paddock(draft, { minX: -6.4, maxX: -1, minZ: -4, maxZ: 1.4 }, { x: 0, z: 2 }, [['cow', 3], ['horse', 2]], 'map-left', random)
      const right = paddock(draft, { minX: 1.2, maxX: 6.6, minZ: -4, maxZ: 1.4 }, { x: 0, z: 2 }, [['sheep', 4], ['pig', 2]], 'map-right', random)
      const east = paddock(draft, { minX: 9.4, maxX: 13.6, minZ: 9.4, maxZ: 13.6 }, { x: 8, z: 8 }, [['horse', 2]], 'map-east', random)
      const west = paddock(draft, { minX: -13.2, maxX: -9.2, minZ: 8.6, maxZ: 12.6 }, { x: -8, z: 8 }, [['sheep', 3]], 'map-west', random)
      landmark(draft, 'windmill', { x: 0.1, z: 3 }, 0.6, 0.8)
      const yard = barnCluster(draft, { x: 0.8, z: 8.6 }, 0)
      const stubble: Rect = { minX: -10.4, maxX: 9.6, minZ: -12.6, maxZ: -10.6 }
      for (let x = stubble.minX + 1.4; x < stubble.maxX - 0.8; x += 3.4) draft.forceFeature(Math.round(x) % 2 === 0 ? 'baleStack' : 'hayBale', { x, z: -11.6 }, random() * 0.4, 1)
      return {
        patches: [left.patch, right.patch, east.patch, west.patch, yard, { rect: stubble, color: STUBBLE }],
        blocks: [left.patch.rect, right.patch.rect, east.patch.rect, west.patch.rect, yard.rect, stubble],
        animals: [...left.animals, ...right.animals, ...east.animals, ...west.animals],
        pasture: left.area,
        butterflies: [center(left.patch.rect), center(right.patch.rect)],
      }
    }),
  farm: (input, random) =>
    composeFarm('barnyard', input, random, ({ draft, hw, hh }) => {
      const side = 5.4
      const pen = paddock(draft, { minX: -hw - 2 - side, maxX: -hw - 2, minZ: -hh - 0.6, maxZ: -hh - 0.6 + side }, { x: 0, z: 0 }, [['cow', 2], ['horse', 1], ['sheep', 2]], 'farm-pen', random)
      const yard = barnCluster(draft, { x: -hw - 2.6, z: -hh - 6.2 }, 0)
      draft.forceFeature('baleStack', { x: hw + 3.2, z: hh + 2.8 }, 0.4, 1)
      draft.forceFeature('hayBale', { x: hw + 1.8, z: hh + 3.6 }, 1.2, 1)
      landmark(draft, 'windmill', { x: hw + 6, z: -hh - 6 }, 0.6, 0.8)
      return { patches: [pen.patch, yard], blocks: [pen.patch.rect, yard.rect], animals: pen.animals, pasture: pen.area }
    }),
}
