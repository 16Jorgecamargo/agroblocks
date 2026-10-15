export interface ModelBounds {
  min: [number, number, number]
  max: [number, number, number]
}

export interface FitTarget {
  targetHeight?: number
  targetWidth?: number
}

export interface FitResult {
  scale: number
  yOffset: number
}

const PRECISION = 10000

function round(value: number): number {
  return Math.round(value * PRECISION) / PRECISION + 0
}

export function fitWithScale(bounds: ModelBounds, scale: number): FitResult {
  return { scale: round(scale), yOffset: round(-bounds.min[1] * scale) }
}

export function fitToTarget(bounds: ModelBounds, target: FitTarget): FitResult {
  const height = bounds.max[1] - bounds.min[1]
  const width = Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2])
  if (height <= 0 && width <= 0) return { scale: 1, yOffset: 0 }
  if (target.targetWidth !== undefined && width > 0) return fitWithScale(bounds, target.targetWidth / width)
  if (target.targetHeight !== undefined && height > 0) return fitWithScale(bounds, target.targetHeight / height)
  return fitWithScale(bounds, 1)
}
