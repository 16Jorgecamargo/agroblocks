import { rectPolygon } from '@/render/world/geometry'
import { center, inset, landmark } from '@/render/world/landscapes/landscapeKit'
import type { Landscape } from '@/render/world/landscapes/landscapeTypes'
import { blob, stain, turn } from '@/render/world/landscapes/natureKit'
import { around } from '@/render/world/navigation/planActors'
import { bedPlot, channel, edgeSides, type Side } from '@/render/world/landscapes/plots'
import { stageFarm, stageMap, type StageLook } from '@/render/world/landscapes/stage'
import { spawnHerd } from '@/render/world/scenery'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { AnimalSpawn, AnimalSpecies, GroundPatch, Rect, Stain, Vec2 } from '@/render/world/worldTypes'

const PADDOCK = '#8fcf63'
const MEADOW = '#a3c565'
const RUN = '#b5b27a'
const YARD = '#b49a6a'
const STRAW = '#d9c682'
const MUD = '#7a5f45'
const WORN = '#a48a5e'
const LOOK: StageLook = { trees: ['tree-a', 'pine', 'tree-c', 'pine-round', 'tree-b', 'pine', 'tree-d'] }

export interface Pen {
  patch: GroundPatch
  animals: AnimalSpawn[]
  area: Vec2[]
  gate: Vec2
}

export interface PenOptions {
  herd: [AnimalSpecies, number][]
  gate: Side
  color?: string
  shelter?: string
  rack?: boolean
}

function gatePoint(rect: Rect, side: Side): Vec2 {
  const middle = center(rect)
  if (side === 'minX') return { x: rect.minX - 0.4, z: middle.z }
  if (side === 'maxX') return { x: rect.maxX + 0.4, z: middle.z }
  if (side === 'minZ') return { x: middle.x, z: rect.minZ - 0.4 }
  return { x: middle.x, z: rect.maxZ + 0.4 }
}

export function pen(draft: WorldDraft, rect: Rect, name: string, random: () => number, options: PenOptions): Pen {
  const gate = gatePoint(rect, options.gate)
  edgeSides(draft, 'woodFence', rect, ['minX', 'maxX', 'minZ', 'maxZ'], 0.4, [gate])
  const middle = center(rect)
  draft.forceFeature('trough', { x: middle.x + (rect.maxX - middle.x) * 0.5, z: rect.minZ + 0.8 }, 0, 1)
  if (options.shelter) draft.forceFeature('animalShelter', { x: rect.minX + 1.3, z: rect.minZ + 1.0 }, 0, 1, options.shelter)
  if (options.rack) draft.forceFeature('hayRack', { x: rect.maxX - 1.0, z: middle.z }, Math.PI / 2, 1)
  const area = rectPolygon(inset(rect, 0.7))
  return { patch: { rect, color: options.color ?? PADDOCK }, animals: spawnHerd(random, area, options.herd, name, 0.9), area, gate }
}

function chickenRun(draft: WorldDraft, rect: Rect, gate: Side, random: () => number): GroundPatch {
  edgeSides(draft, 'woodFence', rect, ['minX', 'maxX', 'minZ', 'maxZ'], 0.4, [gatePoint(rect, gate)])
  const middle = center(rect)
  landmark(draft, 'chicken-coop', { x: rect.minX + 1.2, z: rect.minZ + 1.1 }, 0.3, 0.9)
  landmark(draft, 'nestBoxes', { x: rect.maxX - 0.9, z: rect.minZ + 0.7 }, 0)
  for (let index = 0; index < 6; index += 1) {
    const angle = index * 1.9
    draft.forceFeature('chicken', { x: middle.x + Math.cos(angle) * (0.6 + (index % 3) * 0.4), z: middle.z + 0.4 + Math.sin(angle) * 0.7 }, random() * Math.PI * 2, 1)
  }
  return { rect, color: RUN }
}

export function barnComplex(draft: WorldDraft, at: Vec2, rotation: number, random: () => number): Stain[] {
  const spot = (x: number, z: number) => turn(at, rotation, x, z)
  landmark(draft, 'barn', at, rotation, 0.85)
  landmark(draft, 'silo', spot(-3.0, -0.8), rotation, 0.85)
  landmark(draft, 'feedShed', spot(3.2, -0.4), rotation)
  draft.forceFeature('baleStack', spot(-1.6, 2.9), rotation + 0.2)
  draft.forceFeature('hayBale', spot(0.2, 3.2), rotation + 1.3)
  draft.forceFeature('sackPallet', spot(2.6, 1.8), rotation)
  draft.forceFeature('barrels', spot(3.8, 1.6), rotation)
  return [{ points: blob(spot(0.2, 3.4), 4.4, 2.6, random, 12), color: YARD }, stain(spot(-1.2, 2.4), 1.6, 0.9, STRAW, random), stain(spot(2.6, -0.2), 1.5, 1.1, STRAW, random)]
}

function hayStore(draft: WorldDraft, at: Vec2, random: () => number): Stain {
  draft.forceFeature('baleStack', at, 0.1)
  draft.forceFeature('baleStack', { x: at.x + 2.0, z: at.z + 0.3 }, -0.2)
  draft.forceFeature('hayBale', { x: at.x + 0.6, z: at.z + 1.4 }, 1.4)
  draft.forceFeature('hayBale', { x: at.x + 1.6, z: at.z + 1.6 }, 0.3)
  return stain({ x: at.x + 1.0, z: at.z + 0.6 }, 2.4, 1.6, STRAW, random)
}

function maintenanceCorner(draft: WorldDraft, at: Vec2, random: () => number): Stain {
  landmark(draft, 'equipmentRack', { x: at.x + 1.6, z: at.z - 1.0 }, 0.2)
  draft.forceFeature('cornWagon', { x: at.x - 1.9, z: at.z - 0.6 }, -0.3)
  landmark(draft, 'log-stack', { x: at.x + 2.2, z: at.z + 0.8 }, 1.1, 0.8)
  return stain({ x: at.x + 0.2, z: at.z }, 2.6, 1.6, WORN, random)
}

function homePlot(draft: WorldDraft, at: Vec2, random: () => number): GroundPatch {
  landmark(draft, 'farmhouse', at, 0, 0.8)
  draft.forceFeature('wheelbarrow', { x: at.x + 2.0, z: at.z + 0.4 }, 0.8)
  return bedPlot(draft, { minX: at.x - 1.6, maxX: at.x + 1.4, minZ: at.z - 4.4, maxZ: at.z - 2.0 }, random, { crops: ['herbBed', 'cabbageBed', 'carrotBed'] })
}

export const barnyardLandscape: Landscape = {
  map: (input, random) =>
    stageMap('barnyard', input, random, LOOK, ({ draft }) => {
      const cows = pen(draft, { minX: -12.6, maxX: -5.6, minZ: -12.6, maxZ: -5.4 }, 'map-cows', random, { herd: [['cow', 3]], gate: 'maxX', shelter: '#7d868e', rack: true })
      const sheep = pen(draft, { minX: -2.0, maxX: 4.6, minZ: -7.0, maxZ: -3.0 }, 'map-sheep', random, { herd: [['sheep', 4]], gate: 'maxX', rack: true })
      const pigs = pen(draft, { minX: 9.6, maxX: 12.8, minZ: -12.8, maxZ: -7.2 }, 'map-pigs', random, { herd: [['pig', 2]], gate: 'minX', color: '#9a8a5a', shelter: '#8a5a3c' })
      const horses = pen(draft, { minX: 10.4, maxX: 12.8, minZ: -4.6, maxZ: 3.8 }, 'map-horses', random, { herd: [['horse', 2]], gate: 'minX' })
      const field = pen(draft, { minX: 5.2, maxX: 12.6, minZ: 6.6, maxZ: 12.6 }, 'map-field', random, { herd: [['cow', 1], ['sheep', 1]], gate: 'minX', color: MEADOW, shelter: '#a33b2f' })
      const run = chickenRun(draft, { minX: -12.4, maxX: -8.2, minZ: -4.8, maxZ: -0.6 }, 'maxX', random)
      const stains = [
        ...barnComplex(draft, { x: -1.4, z: 0.2 }, 0, random),
        hayStore(draft, { x: -6.0, z: 1.9 }, random),
        maintenanceCorner(draft, { x: 4.8, z: -0.8 }, random),
        stain({ x: 10.8, z: -10.0 }, 1.4, 2.0, MUD, random),
        stain({ x: -5.4, z: -9.0 }, 1.0, 1.4, WORN, random),
        stain({ x: 4.9, z: 9.6 }, 1.0, 1.3, WORN, random),
        stain({ x: -10.0, z: -9.6 }, 1.8, 1.2, STRAW, random),
      ]
      const home = homePlot(draft, { x: -10.8, z: 4.8 }, random)
      const waters = [channel({ minX: -3.2, maxX: 8.0, minZ: -11.9, maxZ: -11.55 })]
      return {
        patches: [cows.patch, sheep.patch, pigs.patch, horses.patch, field.patch, run, home],
        blocks: [cows.patch.rect, sheep.patch.rect, pigs.patch.rect, horses.patch.rect, field.patch.rect, run.rect],
        stains,
        waters,
        animals: [...cows.animals, ...sheep.animals, ...pigs.animals, ...horses.animals, ...field.animals],
        pasture: cows.area,
        butterflies: [center(field.patch.rect), center(home.rect)],
        birds: [{ x: -9, z: -9 }, { x: 9, z: 9.6 }, { x: 0, z: -1 }],
        gaps: [{ x: -14.4, z: 8 }],
        jobs: [
          { id: 'barn-feeder', kind: 'worker', task: 'feed', shirt: 0, area: around({ x: -7.35, z: -11.0 }) },
          { id: 'barn-hay', kind: 'worker', task: 'carry', shirt: 2, stops: 2, area: around(...[{ x: -4.6, z: 3.6 }, { x: -1.4, z: 3.8 }, { x: 2.4, z: 2.2 }]) },
          { id: 'barn-eggs', kind: 'worker', task: 'pick', shirt: 4, area: around({ x: -9.1, z: -3.3 }) },
          { id: 'barn-tractor', kind: 'tractor', via: [{ x: 4.6, z: -1.2 }, { x: -1.0, z: 4.2 }] },
          { id: 'barn-mechanic', kind: 'worker', task: 'tend', shirt: 5, area: around({ x: 6.2, z: -2.0 }) },
          { id: 'barn-gardener', kind: 'worker', task: 'water', shirt: 1, stops: 2, area: around(...[{ x: -12.2, z: 3.1 }, { x: -9.6, z: 3.1 }]) },
        ],
        paths: [
          { points: [{ x: -1.6, z: 5.6 }, { x: -2.6, z: 3.4 }], width: 1.0 },
          { points: [{ x: 5.6, z: 1.6 }, { x: 5.4, z: -2.4 }, { x: 5.0, z: -5.0 }], width: 0.9 },
          { points: [{ x: -3.6, z: -8.6 }, { x: -5.0, z: -8.9 }], width: 0.9 },
          { points: [{ x: -8.0, z: 8.0 }, { x: -7.6, z: 4.2 }, { x: -7.6, z: -2.7 }], width: 0.8 },
        ],
      }
    }),
  farm: (input, random) =>
    stageFarm('barnyard', input, random, LOOK, ({ draft, hw, hh }) => {
      const cows = pen(draft, { minX: -hw - 8.6, maxX: -hw - 2.4, minZ: -hh - 0.6, maxZ: hh + 4.4 }, 'farm-cows', random, { herd: [['cow', 2], ['horse', 1]], gate: 'maxX', rack: true })
      const sheep = pen(draft, { minX: hw + 4.6, maxX: hw + 9.4, minZ: -hh - 8, maxZ: -hh - 3 }, 'farm-sheep', random, { herd: [['sheep', 3]], gate: 'minX', shelter: '#7d868e' })
      const run = chickenRun(draft, { minX: hw + 1.6, maxX: hw + 5.2, minZ: hh + 1.8, maxZ: hh + 4.8 }, 'minX', random)
      const stains = [...barnComplex(draft, { x: -hw - 3.4, z: -hh - 6.2 }, 0, random), hayStore(draft, { x: hw + 0.4, z: -hh - 6.4 }, random), stain({ x: hw + 3, z: -1.8 }, 1.4, 1.0, WORN, random)]
      return {
        patches: [cows.patch, sheep.patch, run],
        blocks: [cows.patch.rect, sheep.patch.rect, run.rect],
        stains,
        animals: [...cows.animals, ...sheep.animals],
        pasture: cows.area,
        jobs: [{ id: 'barn-farm-feeder', kind: 'worker', task: 'feed', shirt: 0, area: around({ x: -hw - 4.0, z: -hh + 0.2 + 0.8 }) }, { id: 'barn-farm-eggs', kind: 'worker', task: 'pick', shirt: 4, area: around({ x: hw + 4.3, z: hh + 3.3 }) }],
      }
    }),
}
