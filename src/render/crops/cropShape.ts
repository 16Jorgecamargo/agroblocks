import type { PlotState } from '@/game/world/types'

export type CropStage = 'planted' | 'growing' | 'ready'

export type CropKind = 'vegetable' | 'corn' | 'fruit' | 'seedling' | 'grain' | 'mixed'

export interface CropLeaf {
  x: number
  y: number
  z: number
  radius: number
  squash: number
}

export interface CropFruit {
  x: number
  y: number
  z: number
  radius: number
  color: 'green' | 'red' | 'yellow' | 'orange'
}

export interface CropShape {
  stemHeight: number
  leaves: CropLeaf[]
  fruits: CropFruit[]
  width: number
  height: number
  glow: boolean
  mound: boolean
}

export function cropStageFor(plot: PlotState): CropStage | null {
  if (plot === 'seeded') return 'planted'
  if (plot === 'growing') return 'growing'
  if (plot === 'mature') return 'ready'
  return null
}

function leafRing(count: number, distance: number, y: number, radius: number, squash: number, offset = 0): CropLeaf[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = offset + (index / count) * Math.PI * 2
    return { x: Math.cos(angle) * distance, y, z: Math.sin(angle) * distance, radius, squash }
  })
}

function fruitRing(count: number, distance: number, y: number, radius: number, color: CropFruit['color']): CropFruit[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + 0.3
    return { x: Math.cos(angle) * distance, y: y + (index % 2) * 0.08, z: Math.sin(angle) * distance, radius, color }
  })
}

function measure(stemHeight: number, leaves: CropLeaf[], fruits: CropFruit[], glow: boolean, mound: boolean): CropShape {
  const parts = [...leaves, ...fruits]
  const width = Math.max(...parts.map((part) => 2 * (Math.hypot(part.x, part.z) + part.radius)))
  const height = Math.max(stemHeight, ...parts.map((part) => part.y + part.radius))
  return { stemHeight, leaves, fruits, width, height, glow, mound }
}

const MIXED_KINDS: CropKind[] = ['vegetable', 'corn', 'fruit', 'grain']

export function resolveCrop(kind: CropKind, x: number, y: number): Exclude<CropKind, 'mixed'> {
  if (kind !== 'mixed') return kind
  return MIXED_KINDS[(x + y * 3) % MIXED_KINDS.length] as Exclude<CropKind, 'mixed'>
}

function cornShape(stage: CropStage): CropShape {
  if (stage === 'planted') return measure(0.16, [{ x: 0.05, y: 0.15, z: 0, radius: 0.05, squash: 0.4 }, { x: -0.05, y: 0.12, z: 0, radius: 0.05, squash: 0.4 }], [], false, true)
  if (stage === 'growing') return measure(0.45, [{ x: 0.1, y: 0.25, z: 0, radius: 0.09, squash: 0.35 }, { x: -0.1, y: 0.35, z: 0, radius: 0.09, squash: 0.35 }, { x: 0, y: 0.47, z: 0, radius: 0.06, squash: 0.6 }], [], false, false)
  return measure(
    0.75,
    [
      { x: 0.11, y: 0.3, z: 0, radius: 0.1, squash: 0.3 },
      { x: -0.11, y: 0.45, z: 0, radius: 0.1, squash: 0.3 },
      { x: 0.1, y: 0.6, z: 0.02, radius: 0.09, squash: 0.3 },
      { x: 0, y: 0.78, z: 0, radius: 0.05, squash: 1 },
    ],
    [
      { x: 0.06, y: 0.5, z: 0.04, radius: 0.07, color: 'yellow' },
      { x: -0.06, y: 0.38, z: -0.03, radius: 0.07, color: 'yellow' },
    ],
    true,
    false,
  )
}

function fruitShape(stage: CropStage): CropShape {
  if (stage === 'planted') return measure(0.14, [{ x: 0, y: 0.17, z: 0, radius: 0.07, squash: 0.7 }], [], false, true)
  if (stage === 'growing') return measure(0.3, [...leafRing(4, 0.1, 0.32, 0.12, 0.9)], [], false, false)
  return measure(0.32, [...leafRing(5, 0.12, 0.36, 0.15, 0.95), { x: 0, y: 0.5, z: 0, radius: 0.14, squash: 0.9 }], [
    ...fruitRing(3, 0.2, 0.34, 0.07, 'orange'),
    ...fruitRing(2, 0.12, 0.46, 0.065, 'red'),
  ], true, false)
}

function seedlingShape(stage: CropStage): CropShape {
  if (stage === 'planted') return measure(0.08, [{ x: 0.04, y: 0.09, z: 0, radius: 0.045, squash: 0.5 }, { x: -0.04, y: 0.09, z: 0, radius: 0.045, squash: 0.5 }], [], false, true)
  if (stage === 'growing') return measure(0.16, [...leafRing(4, 0.08, 0.14, 0.08, 0.6)], [], false, false)
  return measure(0.2, [...leafRing(5, 0.1, 0.17, 0.1, 0.65)], fruitRing(4, 0.12, 0.24, 0.05, 'yellow'), true, false)
}

function grainShape(stage: CropStage): CropShape {
  if (stage === 'planted') return measure(0.12, [{ x: 0, y: 0.12, z: 0, radius: 0.05, squash: 0.5 }], [], false, true)
  if (stage === 'growing') return measure(0.35, [{ x: 0.06, y: 0.25, z: 0, radius: 0.06, squash: 0.4 }, { x: -0.06, y: 0.3, z: 0, radius: 0.06, squash: 0.4 }], [], false, false)
  return measure(0.5, [{ x: 0.06, y: 0.28, z: 0, radius: 0.06, squash: 0.4 }, { x: -0.06, y: 0.34, z: 0, radius: 0.06, squash: 0.4 }], [
    { x: 0, y: 0.56, z: 0, radius: 0.06, color: 'yellow' },
    { x: 0.05, y: 0.5, z: 0.03, radius: 0.05, color: 'yellow' },
    { x: -0.05, y: 0.52, z: -0.03, radius: 0.05, color: 'yellow' },
  ], true, false)
}

export function cropShape(stage: CropStage, kind: CropKind = 'vegetable'): CropShape {
  const resolved = resolveCrop(kind, 0, 0)
  if (resolved === 'corn') return cornShape(stage)
  if (resolved === 'fruit') return fruitShape(stage)
  if (resolved === 'seedling') return seedlingShape(stage)
  if (resolved === 'grain') return grainShape(stage)
  return vegetableShape(stage)
}

function vegetableShape(stage: CropStage): CropShape {
  if (stage === 'planted') {
    return measure(
      0.12,
      [
        { x: 0.07, y: 0.13, z: 0, radius: 0.06, squash: 0.45 },
        { x: -0.07, y: 0.13, z: 0, radius: 0.06, squash: 0.45 },
      ],
      [],
      false,
      true,
    )
  }
  if (stage === 'growing') {
    return measure(0.25, [...leafRing(5, 0.15, 0.2, 0.13, 0.75), { x: 0, y: 0.34, z: 0, radius: 0.12, squash: 0.8 }], [], false, false)
  }
  return measure(
    0.3,
    [...leafRing(6, 0.2, 0.24, 0.15, 0.75), ...leafRing(3, 0.09, 0.38, 0.13, 0.8, 0.5), { x: 0, y: 0.46, z: 0, radius: 0.1, squash: 0.85 }],
    fruitRing(6, 0.27, 0.22, 0.085, 'red'),
    true,
    false,
  )
}
