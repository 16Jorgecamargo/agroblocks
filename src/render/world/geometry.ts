import type { Polyline, Rect, Vec2 } from '@/render/world/worldTypes'

export function distanceToSegment(point: Vec2, start: Vec2, end: Vec2): number {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const lengthSquared = dx * dx + dz * dz
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared))
  return Math.hypot(point.x - (start.x + dx * t), point.z - (start.z + dz * t))
}

export function distanceToPolyline(point: Vec2, line: Vec2[]): number {
  if (line.length === 1) return Math.hypot(point.x - line[0].x, point.z - line[0].z)
  let best = Infinity
  for (let index = 0; index < line.length - 1; index += 1) best = Math.min(best, distanceToSegment(point, line[index], line[index + 1]))
  return best
}

export function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index]
    const b = polygon[previous]
    const crosses = a.z > point.z !== b.z > point.z && point.x < ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

export function rectDistance(point: Vec2, rect: Rect): number {
  const dx = Math.max(rect.minX - point.x, 0, point.x - rect.maxX)
  const dz = Math.max(rect.minZ - point.z, 0, point.z - rect.maxZ)
  return Math.hypot(dx, dz)
}

export function rectPolygon(rect: Rect): Vec2[] {
  return [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
}

export function polygonBounds(polygon: Vec2[]): Rect {
  return {
    minX: Math.min(...polygon.map((point) => point.x)),
    maxX: Math.max(...polygon.map((point) => point.x)),
    minZ: Math.min(...polygon.map((point) => point.z)),
    maxZ: Math.max(...polygon.map((point) => point.z)),
  }
}

export function segmentIntersection(a: Vec2, b: Vec2, c: Vec2, d: Vec2): Vec2 | null {
  const denominator = (b.x - a.x) * (d.z - c.z) - (b.z - a.z) * (d.x - c.x)
  if (denominator === 0) return null
  const t = ((c.x - a.x) * (d.z - c.z) - (c.z - a.z) * (d.x - c.x)) / denominator
  const u = ((c.x - a.x) * (b.z - a.z) - (c.z - a.z) * (b.x - a.x)) / denominator
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { x: a.x + t * (b.x - a.x) + 0, z: a.z + t * (b.z - a.z) + 0 }
}

export function polylineLength(line: Vec2[]): number {
  let total = 0
  for (let index = 0; index < line.length - 1; index += 1) total += Math.hypot(line[index + 1].x - line[index].x, line[index + 1].z - line[index].z)
  return total
}

export function pointAlong(line: Vec2[], fraction: number): Vec2 {
  let remaining = polylineLength(line) * Math.max(0, Math.min(1, fraction))
  for (let index = 0; index < line.length - 1; index += 1) {
    const start = line[index]
    const end = line[index + 1]
    const length = Math.hypot(end.x - start.x, end.z - start.z)
    if (remaining <= length || index === line.length - 2) {
      const t = length === 0 ? 0 : remaining / length
      return { x: start.x + (end.x - start.x) * t, z: start.z + (end.z - start.z) * t }
    }
    remaining -= length
  }
  return line[line.length - 1]
}

export function crossings(path: Polyline, river: Polyline): { point: Vec2; angle: number }[] {
  const found: { point: Vec2; angle: number }[] = []
  for (let i = 0; i < path.points.length - 1; i += 1) {
    for (let j = 0; j < river.points.length - 1; j += 1) {
      const point = segmentIntersection(path.points[i], path.points[i + 1], river.points[j], river.points[j + 1])
      if (!point) continue
      const dx = path.points[i + 1].x - path.points[i].x
      const dz = path.points[i + 1].z - path.points[i].z
      found.push({ point, angle: Math.atan2(-dz, dx) })
    }
  }
  return found
}
