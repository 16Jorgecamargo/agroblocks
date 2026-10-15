import type { ModelId } from '@/render/models/manifest'
import { distanceToPolyline, pointInPolygon, rectDistance } from '@/render/world/geometry'
import { EXEMPT_MODELS, footprint, FRONT_CLEARANCE, GRID_CLEARANCE, isClutter, RIVER_BANK, TALL_MODELS } from '@/render/world/worldCatalog'
import type { Polyline, PropItem, Rect, Vec2 } from '@/render/world/worldTypes'

export interface DraftRules {
  grid: Rect | null
  paths: Polyline[]
  river: Polyline | null
  keepOut: Vec2[][]
  frontGuard: Rect | null
  bounds?: Rect
}

const SPIRAL_STEP = 0.5
const SPIRAL_LIMIT = 4
const SPIRAL_ANGLES = 12
const SCATTER_TRIES = 14

export class WorldDraft {
  readonly props: PropItem[] = []

  constructor(
    private readonly random: () => number,
    private readonly rules: DraftRules,
  ) {}

  isFree(model: ModelId, point: Vec2, scale = 1): boolean {
    const radius = footprint(model) * scale
    const { grid, paths, river, keepOut, frontGuard, bounds } = this.rules
    if (bounds && (point.x < bounds.minX || point.x > bounds.maxX || point.z < bounds.minZ || point.z > bounds.maxZ)) return false
    if (grid && rectDistance(point, grid) < GRID_CLEARANCE + radius) return false
    if (frontGuard && TALL_MODELS.has(model) && point.x + point.z > 0 && rectDistance(point, frontGuard) < FRONT_CLEARANCE) return false
    for (const path of paths) if (distanceToPolyline(point, path.points) < path.width / 2 + radius) return false
    if (river && distanceToPolyline(point, river.points) < river.width / 2 + radius + RIVER_BANK) return false
    if (!isClutter(model) && keepOut.some((zone) => pointInPolygon(point, zone))) return false
    return this.props.every((prop) => EXEMPT_MODELS.has(prop.model) || Math.hypot(prop.x - point.x, prop.z - point.z) >= footprint(prop.model) * prop.scale + radius)
  }

  place(model: ModelId, point: Vec2, rotation: number, scale: number): boolean {
    if (!this.isFree(model, point, scale)) return false
    this.props.push({ model, x: point.x, z: point.z, rotation, scale })
    return true
  }

  placeNear(model: ModelId, point: Vec2, rotation: number, scale = 1): boolean {
    if (this.place(model, point, rotation, scale)) return true
    for (let radius = SPIRAL_STEP; radius <= SPIRAL_LIMIT; radius += SPIRAL_STEP) {
      for (let step = 0; step < SPIRAL_ANGLES; step += 1) {
        const angle = (step / SPIRAL_ANGLES) * Math.PI * 2
        if (this.place(model, { x: point.x + Math.cos(angle) * radius, z: point.z + Math.sin(angle) * radius }, rotation, scale)) return true
      }
    }
    return false
  }

  force(model: ModelId, point: Vec2, rotation: number, scale = 1): void {
    this.props.push({ model, x: point.x, z: point.z, rotation, scale })
  }

  scatter(models: readonly ModelId[], count: number, area: Rect, scaleRange: [number, number], accept: (point: Vec2) => boolean = () => true): number {
    let placed = 0
    for (let tries = 0; tries < count * SCATTER_TRIES && placed < count; tries += 1) {
      const point = { x: area.minX + this.random() * (area.maxX - area.minX), z: area.minZ + this.random() * (area.maxZ - area.minZ) }
      if (!accept(point)) continue
      const model = models[Math.floor(this.random() * models.length)]
      const scale = scaleRange[0] + this.random() * (scaleRange[1] - scaleRange[0])
      if (this.place(model, point, this.random() * Math.PI * 2, scale)) placed += 1
    }
    return placed
  }

  fenceLine(from: Vec2, to: Vec2, gateIndex = -1): void {
    const dx = to.x - from.x
    const dz = to.z - from.z
    const length = Math.hypot(dx, dz)
    const segments = Math.max(1, Math.round(length))
    const rotation = Math.atan2(-dz, dx)
    for (let index = 0; index < segments; index += 1) {
      const t = (index + 0.5) / segments
      this.force(index === gateIndex ? 'fence-gate' : 'fence', { x: from.x + dx * t, z: from.z + dz * t }, rotation, length / segments)
    }
  }
}
