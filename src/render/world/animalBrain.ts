import { DURATIONS } from '@/motion/presets'
import { distanceToSegment, pointInPolygon, polygonBounds, segmentDistance } from '@/render/world/geometry'
import type { AnimalSpecies, Vec2 } from '@/render/world/worldTypes'

export type AnimalPhase = 'idle' | 'walk'

export type AnimalGait = 'walk' | 'graze'

export interface Course {
  from: Vec2
  to: Vec2
  radius?: number
}

export const SPECIES_GAIT: Record<AnimalSpecies, AnimalGait> = {
  cow: 'walk',
  horse: 'walk',
  pig: 'graze',
  sheep: 'graze',
  llama: 'graze',
  pug: 'graze',
}

export const BODY_RADIUS: Record<AnimalSpecies, number> = {
  cow: 0.55,
  horse: 0.6,
  pig: 0.4,
  sheep: 0.4,
  llama: 0.45,
  pug: 0.25,
}

export const SPECIES_SPEED: Record<AnimalSpecies, number> = {
  cow: 0.45,
  horse: 0.9,
  pig: 0.7,
  sheep: 0.8,
  llama: 0.8,
  pug: 1.2,
}

const TARGET_TRIES = 40
const PERSONAL_SPACE = 1.2
const PASSING_SPACE = 1

export function idleSeconds(random: () => number): number {
  return DURATIONS.animalIdleMin + random() * (DURATIONS.animalIdleMax - DURATIONS.animalIdleMin)
}

export function walkSeconds(from: Vec2, to: Vec2, speed: number): number {
  return Math.max(DURATIONS.animalStepMin, Math.hypot(to.x - from.x, to.z - from.z) / speed)
}

export function nextTarget(random: () => number, area: Vec2[], from: Vec2, minStep = 1.2, others: Course[] = [], spacing = 1): Vec2 {
  const bounds = polygonBounds(area)
  for (let tries = 0; tries < TARGET_TRIES; tries += 1) {
    const candidate = { x: bounds.minX + random() * (bounds.maxX - bounds.minX), z: bounds.minZ + random() * (bounds.maxZ - bounds.minZ) }
    if (!pointInPolygon(candidate, area) || Math.hypot(candidate.x - from.x, candidate.z - from.z) < minStep) continue
    const crowded = others.some(
      (other) =>
        distanceToSegment(candidate, other.from, other.to) < PERSONAL_SPACE * spacing ||
        segmentDistance(from, candidate, other.from, other.to) < PASSING_SPACE * spacing,
    )
    if (!crowded) return candidate
  }
  return from
}

const walkKeys = new WeakMap<Vec2[], Set<string>>()

function keyOf(point: Vec2, cell: number): string {
  return `${Math.floor(point.x / cell)},${Math.floor(point.z / cell)}`
}

function keysFor(walk: Vec2[], cell: number): Set<string> {
  let keys = walkKeys.get(walk)
  if (!keys) {
    keys = new Set(walk.map((point) => keyOf(point, cell)))
    walkKeys.set(walk, keys)
  }
  return keys
}

function staysOnWalk(keys: Set<string>, from: Vec2, to: Vec2, cell: number): boolean {
  const samples = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / (cell / 2)))
  for (let step = 0; step <= samples; step += 1) {
    const t = step / samples
    if (!keys.has(keyOf({ x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t }, cell))) return false
  }
  return true
}

export function nextWalkTarget(random: () => number, walk: Vec2[], from: Vec2, radius: number, others: Course[], minStep = 1.2, cell = 0.25): Vec2 {
  const keys = keysFor(walk, cell)
  for (let tries = 0; tries < TARGET_TRIES; tries += 1) {
    const candidate = walk[Math.floor(random() * walk.length)]
    if (Math.hypot(candidate.x - from.x, candidate.z - from.z) < minStep) continue
    if (!staysOnWalk(keys, from, candidate, cell)) continue
    const blocked = others.some((other) => {
      const gap = radius + (other.radius ?? radius)
      return distanceToSegment(candidate, other.from, other.to) < gap || segmentDistance(from, candidate, other.from, other.to) < gap
    })
    if (!blocked) return candidate
  }
  return from
}

export function headingTo(from: Vec2, to: Vec2): number {
  return Math.atan2(to.x - from.x, to.z - from.z)
}

export function closestAngle(current: number, target: number): number {
  let difference = (target - current) % (Math.PI * 2)
  if (difference > Math.PI) difference -= Math.PI * 2
  if (difference < -Math.PI) difference += Math.PI * 2
  return current + difference
}
