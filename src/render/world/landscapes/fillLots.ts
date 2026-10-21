import { cropBlock } from '@/render/world/landscapes/landscapeKit'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { FeatureKind, GroundPatch, Rect, Vec2 } from '@/render/world/worldTypes'

export type LotKind = 'furrows' | 'youngCrop' | 'stripes' | 'stubble'

export interface LotRecipe {
  kinds: LotKind[]
  youngCrop: { feature: FeatureKind; spacing: [number, number]; scale: number; tint?: string }
  pond: boolean
  canal: boolean
  vignettes: ('tractor' | 'wheelbarrow')[]
}

export interface FilledLots {
  patches: GroundPatch[]
  ponds: Vec2[][]
  canals: Vec2[][]
}

const PLOWED = '#7a5a3a'
const SOIL = '#8a6a3a'
const STUBBLE = '#d9c682'
const POND_AREA = 16

const area = (rect: Rect) => (rect.maxX - rect.minX) * (rect.maxZ - rect.minZ)
const squareness = (rect: Rect) => Math.min(rect.maxX - rect.minX, rect.maxZ - rect.minZ) / Math.max(rect.maxX - rect.minX, rect.maxZ - rect.minZ)

function pondShape(rect: Rect): Vec2[] {
  const cx = (rect.minX + rect.maxX) / 2
  const cz = (rect.minZ + rect.maxZ) / 2
  const rx = (rect.maxX - rect.minX) / 2 - 0.6
  const rz = (rect.maxZ - rect.minZ) / 2 - 0.6
  return Array.from({ length: 10 }, (_, index) => {
    const angle = (index / 10) * Math.PI * 2
    const wobble = index % 2 === 0 ? 1 : 0.9
    return { x: cx + Math.cos(angle) * rx * wobble, z: cz + Math.sin(angle) * rz * wobble }
  })
}

function rectShape(rect: Rect): Vec2[] {
  return [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
}

export function fillLots(draft: WorldDraft, lots: Rect[], recipe: LotRecipe, grass: string, random: () => number): FilledLots {
  const ponds: Vec2[][] = []
  const canals: Vec2[][] = []
  const patches: GroundPatch[] = []
  const pondLot = recipe.pond
    ? lots.filter((lot) => area(lot) >= POND_AREA).sort((a, b) => squareness(b) - squareness(a) || area(b) - area(a))[0]
    : undefined
  if (pondLot) {
    ponds.push(pondShape(pondLot))
    const cx = (pondLot.minX + pondLot.maxX) / 2
    draft.forceFeature('pier', { x: cx, z: pondLot.maxZ - 0.7 }, 0, 1)
    draft.force('lily', { x: cx - 0.9, z: (pondLot.minZ + pondLot.maxZ) / 2 - 0.4 }, random() * Math.PI, 1)
    draft.force('lily', { x: cx + 1, z: (pondLot.minZ + pondLot.maxZ) / 2 + 0.2 }, random() * Math.PI, 1)
  }
  const rest = lots.filter((lot) => lot !== pondLot).sort((a, b) => a.minZ - b.minZ || a.minX - b.minX)
  let tractor = recipe.vignettes.includes('tractor')
  let wheelbarrow = recipe.vignettes.includes('wheelbarrow')
  let canal = recipe.canal
  rest.forEach((lot, index) => {
    const kind = recipe.kinds[index % recipe.kinds.length]
    const middle = { x: (lot.minX + lot.maxX) / 2, z: (lot.minZ + lot.maxZ) / 2 }
    if (kind === 'furrows') {
      patches.push({ rect: lot, color: PLOWED, texture: 'furrows' })
      if (tractor) {
        draft.forceFeature('tractor', { x: lot.minX + 0.9, z: middle.z }, 0, 1)
        tractor = false
      }
    }
    if (kind === 'stripes') patches.push({ rect: lot, color: grass, texture: 'stripes' })
    if (kind === 'stubble') {
      patches.push({ rect: lot, color: STUBBLE })
      const long = lot.maxX - lot.minX >= lot.maxZ - lot.minZ
      const length = long ? lot.maxX - lot.minX : lot.maxZ - lot.minZ
      for (let along = 1; along < length - 0.6; along += 2.4) {
        draft.forceFeature('hayBale', long ? { x: lot.minX + along, z: middle.z } : { x: middle.x, z: lot.minZ + along }, long ? 0 : Math.PI / 2, 1)
      }
    }
    if (kind === 'youngCrop') {
      const growing = canal ? { ...lot, maxZ: lot.maxZ - 0.8 } : lot
      if (canal) {
        canals.push(rectShape({ minX: lot.minX + 0.1, maxX: lot.maxX - 0.1, minZ: lot.maxZ - 0.55, maxZ: lot.maxZ - 0.15 }))
        canal = false
      }
      patches.push({ ...cropBlock(draft, { rect: growing, color: SOIL }, recipe.youngCrop.feature, recipe.youngCrop.spacing, random, { scale: recipe.youngCrop.scale, tints: recipe.youngCrop.tint ? [recipe.youngCrop.tint] : undefined }), rect: lot, texture: 'furrows' })
      if (wheelbarrow) {
        draft.forceFeature('wheelbarrow', { x: lot.maxX + 0.05, z: lot.minZ + 0.2 }, 0.6, 1)
        wheelbarrow = false
      }
    }
  })
  return { patches, ponds, canals }
}
