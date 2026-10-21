import { headingAlong } from '@/render/world/actors/actorMotion'
import { isOpen, type WalkMask } from '@/render/world/navigation/passability'
import { FEATURE_SHAPES } from '@/render/world/navigation/shapes'
import type { ActorTask, FeatureKind, Rect, Vec2, World, WorldFeature } from '@/render/world/worldTypes'

export type WorkTask = Exclude<ActorTask, 'walk' | 'drive'>

export interface WorkSpot {
  at: Vec2
  facing: number
  task: WorkTask
  target: Vec2
}

const PLANTS: readonly FeatureKind[] = ['vegetableBed', 'cabbageBed', 'carrotBed', 'tomatoBed', 'pepperBed', 'onionBed', 'herbBed', 'sproutBed', 'beanTrellis', 'berryBush', 'sapling']

export const TASK_TARGETS: Record<WorkTask, readonly FeatureKind[]> = {
  water: PLANTS,
  hoe: PLANTS,
  pick: ['orchardLadder', 'nestBoxes'],
  feed: ['trough', 'hayRack'],
  tend: ['workbench', 'seedlingTable', 'sortingTable', 'controlStation', 'equipmentRack', 'grainAuger', 'supplyTank', 'compostBins'],
  carry: ['baleStack', 'crateStack', 'sackPallet', 'harvestBin'],
}

const REACH = 0.35

function candidates(feature: WorldFeature): Vec2[] {
  const shape = FEATURE_SHAPES[feature.kind]
  if (shape.form === 'none') return []
  const local: Vec2[] = []
  if (shape.form === 'circle') {
    const radius = shape.radius + REACH
    for (let step = 0; step < 8; step += 1) local.push({ x: Math.cos((step * Math.PI) / 4) * radius, z: Math.sin((step * Math.PI) / 4) * radius })
  } else {
    const halfX = shape.width / 2 + REACH
    const halfZ = shape.depth / 2 + REACH
    const offset = shape.offset ?? { x: 0, z: 0 }
    for (const [x, z] of [
      [halfX, 0],
      [halfX, halfZ],
      [0, halfZ],
      [-halfX, halfZ],
      [-halfX, 0],
      [-halfX, -halfZ],
      [0, -halfZ],
      [halfX, -halfZ],
    ]) local.push({ x: x + offset.x, z: z + offset.z })
  }
  const cos = Math.cos(feature.rotation)
  const sin = Math.sin(feature.rotation)
  return local.map((point) => ({ x: feature.x + (point.x * cos + point.z * sin) * feature.scale, z: feature.z + (-point.x * sin + point.z * cos) * feature.scale }))
}

function inside(point: Vec2, area: Rect): boolean {
  return point.x >= area.minX && point.x <= area.maxX && point.z >= area.minZ && point.z <= area.maxZ
}

export function workSpots(world: World, person: WalkMask, task: WorkTask, area?: Rect): WorkSpot[] {
  const kinds = TASK_TARGETS[task]
  const targets = world.features.filter((feature) => kinds.includes(feature.kind) && (!area || inside(feature, area))).sort((a, b) => a.x - b.x || a.z - b.z)
  return targets.flatMap((feature) => {
    const target = { x: feature.x, z: feature.z }
    return candidates(feature)
      .filter((at) => isOpen(person, at))
      .map((at) => ({ at, facing: headingAlong(at, target), task, target }))
  })
}
