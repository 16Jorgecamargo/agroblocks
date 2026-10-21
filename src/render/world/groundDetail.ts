import { BoxGeometry, type BufferGeometry, Color, Shape, ShapeGeometry } from 'three'
import { compose, mergeParts, part } from '@/render/world/features/parts'
import { offsetPolyline } from '@/render/world/geometry'
import { ribbonGeometry } from '@/render/world/ribbon'
import { WORLD_COLORS } from '@/render/world/worldPalette'
import type { GroundPatch, Vec2, World } from '@/render/world/worldTypes'

export interface GroundDetail {
  texture: BufferGeometry | null
  water: BufferGeometry | null
  bank: BufferGeometry | null
  ruts: BufferGeometry | null
  stains: BufferGeometry | null
}

const RIDGE_STEP = 0.4
const STRIPE_STEP = 1.6
const RUT_WIDTH = 0.16
const BANK_GROWTH = 1.15
const STAIN_HEIGHT = 0.022

function shade(color: string, factor: number): string {
  return `#${new Color(color).multiplyScalar(factor).getHexString()}`
}

function textureParts(patch: GroundPatch): BufferGeometry[] {
  const { rect } = patch
  const base = (patch.height ?? 0) + 0.016
  const width = rect.maxX - rect.minX
  const depth = rect.maxZ - rect.minZ
  const alongX = width >= depth
  const length = alongX ? width : depth
  const across = alongX ? depth : width
  const parts: BufferGeometry[] = []
  if (patch.texture === 'furrows') {
    const color = shade(patch.color, 0.78)
    for (let offset = RIDGE_STEP / 2; offset < across; offset += RIDGE_STEP) {
      const position: [number, number, number] = alongX ? [rect.minX + width / 2, base + 0.025, rect.minZ + offset] : [rect.minX + offset, base + 0.025, rect.minZ + depth / 2]
      parts.push(part(new BoxGeometry(alongX ? length - 0.2 : 0.12, 0.05, alongX ? 0.12 : length - 0.2), color, compose(position)))
    }
  }
  if (patch.texture === 'stripes') {
    const color = shade(patch.color, 1.12)
    for (let offset = 0; offset + STRIPE_STEP / 2 <= length; offset += STRIPE_STEP) {
      const middle = offset + STRIPE_STEP / 4
      const position: [number, number, number] = alongX ? [rect.minX + middle, base + 0.004, rect.minZ + depth / 2] : [rect.minX + width / 2, base + 0.004, rect.minZ + middle]
      parts.push(part(new BoxGeometry(alongX ? STRIPE_STEP / 2 : across, 0.008, alongX ? across : STRIPE_STEP / 2), color, compose(position)))
    }
  }
  return parts
}

function flatShape(points: Vec2[], color: string, y: number): BufferGeometry {
  const shape = new Shape(points.map((point) => ({ x: point.x, y: -point.z }) as never))
  return part(new ShapeGeometry(shape), color, compose([0, y, 0], [-Math.PI / 2, 0, 0]))
}

function grown(points: Vec2[], factor: number): Vec2[] {
  const cx = points.reduce((sum, point) => sum + point.x, 0) / points.length
  const cz = points.reduce((sum, point) => sum + point.z, 0) / points.length
  return points.map((point) => ({ x: cx + (point.x - cx) * factor, z: cz + (point.z - cz) * factor }))
}

export function groundDetail(world: World): GroundDetail {
  const textureList = (world.patches ?? []).flatMap(textureParts)
  const waters = world.waters ?? []
  const stains = world.stains ?? []
  const rutList = world.paths.flatMap((path) => [-1, 1].map((side) => part(ribbonGeometry(offsetPolyline(path.points, side * path.width * 0.22), RUT_WIDTH), shade(world.palette.path, 0.8), compose([0, 0, 0]))))
  return {
    texture: textureList.length > 0 ? mergeParts(textureList) : null,
    water: waters.length > 0 ? mergeParts(waters.map((points) => flatShape(points, WORLD_COLORS.water, 0.03))) : null,
    bank: waters.length > 0 ? mergeParts(waters.map((points) => flatShape(grown(points, BANK_GROWTH), WORLD_COLORS.bank, 0.012))) : null,
    ruts: rutList.length > 0 ? mergeParts(rutList) : null,
    stains: stains.length > 0 ? mergeParts(stains.map((stain) => flatShape(stain.points, stain.color, STAIN_HEIGHT))) : null,
  }
}
