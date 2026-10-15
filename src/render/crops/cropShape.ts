import type { PlotState } from '@/game/world/types'

export type CropStage = 'planted' | 'growing' | 'ready'

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
  color: 'green' | 'red'
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

export function cropShape(stage: CropStage): CropShape {
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
