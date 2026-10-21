import { hashString } from '@/render/seededRandom'
import { pointAlong, polylineLength } from '@/render/world/geometry'
import type { Actor } from '@/render/world/worldTypes'

export interface ActorPose {
  x: number
  z: number
  heading: number
  moving: boolean
  cycle: number
  travelled: number
}

const DEFAULT_PAUSE = 2.6
const STRIDE = 7
const OFFSET_RANGE = 20

export function headingAlong(from: { x: number; z: number }, to: { x: number; z: number }): number {
  return Math.atan2(to.x - from.x, to.z - from.z)
}

function directionAt(route: Actor['route'], fraction: number): number {
  const length = polylineLength(route)
  const step = Math.min(0.05, 0.2 / Math.max(length, 0.01))
  const a = pointAlong(route, Math.max(0, fraction - step))
  const b = pointAlong(route, Math.min(1, fraction + step))
  return headingAlong(a, b)
}

export function actorOffset(actor: Actor): number {
  return (hashString(actor.id) % 1000) / (1000 / OFFSET_RANGE)
}

export function actorPose(actor: Actor, time: number): ActorPose {
  const local = time + actorOffset(actor)
  const start = actor.route[0]
  if (actor.route.length < 2) return { x: start.x, z: start.z, heading: actor.facing ?? 0, moving: false, cycle: local * 3, travelled: 0 }
  const length = polylineLength(actor.route)
  const travel = length / actor.speed
  const pause = actor.pause ?? DEFAULT_PAUSE
  const period = 2 * (travel + pause)
  const t = ((local % period) + period) % period
  const lap = Math.floor(local / period) * 2 * length
  if (t < pause) return { x: start.x, z: start.z, heading: actor.facing ?? directionAt(actor.route, 0) + Math.PI, moving: false, cycle: t * 3, travelled: lap }
  if (t < pause + travel) {
    const fraction = (t - pause) / travel
    const point = pointAlong(actor.route, fraction)
    return { x: point.x, z: point.z, heading: directionAt(actor.route, fraction), moving: true, cycle: fraction * length * STRIDE, travelled: lap + fraction * length }
  }
  const end = actor.route[actor.route.length - 1]
  if (t < 2 * pause + travel) return { x: end.x, z: end.z, heading: actor.facing ?? directionAt(actor.route, 1), moving: false, cycle: (t - pause - travel) * 3, travelled: lap + length }
  const fraction = 1 - (t - 2 * pause - travel) / travel
  const point = pointAlong(actor.route, fraction)
  return { x: point.x, z: point.z, heading: directionAt(actor.route, fraction) + Math.PI, moving: true, cycle: (1 - fraction) * length * STRIDE, travelled: lap + length + (1 - fraction) * length }
}
