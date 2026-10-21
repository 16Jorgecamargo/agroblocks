import { findPath } from '@/render/world/navigation/findPath'
import { cellCenter, cellIndex, type OccupancyGrid } from '@/render/world/navigation/occupancy'
import { isOpen, walkMask, type WalkMask } from '@/render/world/navigation/passability'
import { workSpots, type WorkSpot, type WorkTask } from '@/render/world/navigation/workSpots'
import type { Actor, Rect, Vec2, World } from '@/render/world/worldTypes'

export type Job = { id: string; kind: 'worker'; task: WorkTask; shirt: number; area?: Rect; stops?: 1 | 2 } | { id: string; kind: 'walker'; shirt: number; via: Vec2[] } | { id: string; kind: 'tractor'; via: Vec2[] }

export const SHIRTS = ['#c94f4f', '#4f7fc9', '#e0a83c', '#5aa36a', '#8a5ac9', '#e07a3c', '#3fa3a3']

const WALK_SPEED = 0.55
const DRIVE_SPEED = 1.1
const WORK_PAUSE = 3
const DRIVE_PAUSE = 2.2
const MIN_TRIP = 2
const TRIES = 12
const SNAP = 1.2
const AROUND = 2.5

export function around(...points: Vec2[]): Rect {
  return {
    minX: Math.min(...points.map((point) => point.x)) - AROUND,
    maxX: Math.max(...points.map((point) => point.x)) + AROUND,
    minZ: Math.min(...points.map((point) => point.z)) - AROUND,
    maxZ: Math.max(...points.map((point) => point.z)) + AROUND,
  }
}

export function pickers(prefix: string, count: number, shirt: number): Job[] {
  return Array.from({ length: count }, (_, index) => ({ id: `${prefix}-picker-${index}`, kind: 'worker', task: 'pick', shirt: shirt + index }))
}

function groundHeight(world: World, point: Vec2): number {
  const patch = (world.patches ?? []).find(({ rect, height }) => point.x >= rect.minX && point.x <= rect.maxX && point.z >= rect.minZ && point.z <= rect.maxZ && (height ?? 0) > 0)
  return patch?.height ?? 0
}

function shirt(index: number): string {
  return SHIRTS[index % SHIRTS.length]
}

function nearestOpen(mask: WalkMask, point: Vec2): Vec2 | null {
  if (isOpen(mask, point)) return point
  const { grid } = mask
  const reach = Math.ceil(SNAP / grid.cell)
  const origin = cellIndex(grid, point)
  if (origin < 0) return null
  let best: Vec2 | null = null
  let bestDistance = Infinity
  for (let dz = -reach; dz <= reach; dz += 1) {
    for (let dx = -reach; dx <= reach; dx += 1) {
      const column = (origin % grid.columns) + dx
      const row = Math.floor(origin / grid.columns) + dz
      if (column < 0 || row < 0 || column >= grid.columns || row >= grid.rows) continue
      const index = row * grid.columns + column
      if (!mask.open[index]) continue
      const center = cellCenter(grid, index)
      const distance = Math.hypot(center.x - point.x, center.z - point.z)
      if (distance <= SNAP && distance < bestDistance) {
        best = center
        bestDistance = distance
      }
    }
  }
  return best
}

function chain(mask: WalkMask, via: Vec2[]): Vec2[] | null {
  const stops = via.map((point) => nearestOpen(mask, point))
  if (stops.some((stop) => stop === null) || stops.length < 2) return null
  const route: Vec2[] = [stops[0] as Vec2]
  for (let index = 1; index < stops.length; index += 1) {
    const leg = findPath(mask, stops[index - 1] as Vec2, stops[index] as Vec2)
    if (!leg) return null
    route.push(...leg.slice(1))
  }
  return route
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

function trip(person: WalkMask, spots: WorkSpot[], random: () => number): { from: WorkSpot; to: WorkSpot; route: Vec2[] } | null {
  for (let tries = 0; tries < TRIES; tries += 1) {
    const from = pick(spots, random)
    const others = spots.filter((spot) => (spot.target.x !== from.target.x || spot.target.z !== from.target.z) && Math.hypot(spot.at.x - from.at.x, spot.at.z - from.at.z) >= MIN_TRIP)
    if (others.length === 0) continue
    const to = pick(others, random)
    const route = findPath(person, from.at, to.at)
    if (route) return { from, to, route }
  }
  return null
}

function worker(job: Extract<Job, { kind: 'worker' }>, world: World, person: WalkMask, random: () => number): Actor | null {
  const spots = workSpots(world, person, job.task, job.area)
  if (spots.length === 0) return null
  const base = { id: job.id, kind: 'worker' as const, task: job.task, tint: shirt(job.shirt), speed: WALK_SPEED, pause: WORK_PAUSE }
  if ((job.stops ?? 1) === 1) {
    const spot = pick(spots, random)
    const y = groundHeight(world, spot.at)
    return y > 0 ? { ...base, route: [spot.at], facing: spot.facing, y } : { ...base, route: [spot.at], facing: spot.facing }
  }
  const found = trip(person, spots, random)
  return found ? { ...base, route: found.route, facings: [found.from.facing, found.to.facing] } : null
}

export function planActors(world: World, grid: OccupancyGrid, jobs: Job[], random: () => number): Actor[] {
  const person = walkMask(grid, 'person')
  const tractor = jobs.some((job) => job.kind === 'tractor') ? walkMask(grid, 'tractor') : null
  const actors: Actor[] = []
  for (const job of jobs) {
    if (job.kind === 'worker') {
      const actor = worker(job, world, person, random)
      if (actor) actors.push(actor)
      continue
    }
    if (job.kind === 'walker') {
      const route = chain(person, job.via)
      if (route) actors.push({ id: job.id, kind: 'worker', task: 'walk', route, tint: shirt(job.shirt), speed: WALK_SPEED, pause: WORK_PAUSE })
      continue
    }
    const route = tractor ? chain(tractor, job.via) : null
    if (route) actors.push({ id: job.id, kind: 'tractor', task: 'drive', route, tint: shirt(job.id.length * 3), speed: DRIVE_SPEED, pause: DRIVE_PAUSE })
  }
  return actors
}
