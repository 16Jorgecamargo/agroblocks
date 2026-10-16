import type { CalloutSide } from '@/features/tutorial/tutorialTypes'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface CalloutPlacement {
  side: CalloutSide
  x: number
  y: number
  arrow: number
}

export const CALLOUT_GAP = 14
export const VIEWPORT_MARGIN = 16
export const ARROW_INSET = 18
export const HOLE_PADDING = 6
export const HOLE_RADIUS = 14

const SIDE_ORDER: CalloutSide[] = ['right', 'left', 'bottom', 'top']

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function freeSpace(target: Rect, callout: Size, viewport: Size): Record<CalloutSide, number> {
  return {
    right: viewport.width - (target.x + target.width) - CALLOUT_GAP - VIEWPORT_MARGIN - callout.width,
    left: target.x - CALLOUT_GAP - VIEWPORT_MARGIN - callout.width,
    bottom: viewport.height - (target.y + target.height) - CALLOUT_GAP - VIEWPORT_MARGIN - callout.height,
    top: target.y - CALLOUT_GAP - VIEWPORT_MARGIN - callout.height,
  }
}

export function placeCallout(target: Rect, callout: Size, viewport: Size, prefer?: CalloutSide): CalloutPlacement {
  const space = freeSpace(target, callout, viewport)
  const order = prefer ? [prefer, ...SIDE_ORDER.filter((side) => side !== prefer)] : SIDE_ORDER
  const side = order.find((candidate) => space[candidate] >= 0) ?? order.reduce((best, candidate) => (space[candidate] > space[best] ? candidate : best))
  const centerX = target.x + target.width / 2
  const centerY = target.y + target.height / 2
  if (side === 'right' || side === 'left') {
    const x = side === 'right' ? target.x + target.width + CALLOUT_GAP : target.x - CALLOUT_GAP - callout.width
    const y = clamp(centerY - callout.height / 2, VIEWPORT_MARGIN, viewport.height - VIEWPORT_MARGIN - callout.height)
    return { side, x, y, arrow: clamp(centerY - y, ARROW_INSET, callout.height - ARROW_INSET) }
  }
  const y = side === 'bottom' ? target.y + target.height + CALLOUT_GAP : target.y - CALLOUT_GAP - callout.height
  const x = clamp(centerX - callout.width / 2, VIEWPORT_MARGIN, viewport.width - VIEWPORT_MARGIN - callout.width)
  return { side, x, y, arrow: clamp(centerX - x, ARROW_INSET, callout.width - ARROW_INSET) }
}

export function padRect(rect: Rect, padding: number): Rect {
  return { x: rect.x - padding, y: rect.y - padding, width: rect.width + padding * 2, height: rect.height + padding * 2 }
}

function roundedRect({ x, y, width, height }: Rect, radius: number): string {
  const r = Math.min(radius, width / 2, height / 2)
  const right = x + width
  const bottom = y + height
  return [
    `M${x + r} ${y}`,
    `H${right - r}`,
    `A${r} ${r} 0 0 1 ${right} ${y + r}`,
    `V${bottom - r}`,
    `A${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${bottom - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join('')
}

export function spotlightPath(holes: Rect[], viewport: Size, radius = HOLE_RADIUS): string {
  return `M0 0H${viewport.width}V${viewport.height}H0Z${holes.map((hole) => roundedRect(hole, radius)).join('')}`
}
