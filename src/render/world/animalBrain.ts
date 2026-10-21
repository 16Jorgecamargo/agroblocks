import { DURATIONS } from '@/motion/presets'
import { distanceToSegment, pointInPolygon, polygonBounds, segmentDistance } from '@/render/world/geometry'
import type { AnimalSpecies, Vec2 } from '@/render/world/worldTypes'

export type AnimalPhase = 'idle' | 'walk'

export type AnimalGait = 'walk' | 'graze'

export interface Course {
  from: Vec2
  to: Vec2
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

export function headingTo(from: Vec2, to: Vec2): number {
  return Math.atan2(to.x - from.x, to.z - from.z)
}

export function closestAngle(current: number, target: number): number {
  let difference = (target - current) % (Math.PI * 2)
  if (difference > Math.PI) difference -= Math.PI * 2
  if (difference < -Math.PI) difference += Math.PI * 2
  return current + difference
}
