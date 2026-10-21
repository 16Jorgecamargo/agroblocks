import { BoxGeometry, type BufferGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry } from 'three'
import { compose, mergeParts, part } from '@/render/world/features/parts'
import { workObjects } from '@/render/world/features/workObjects'
import type { ActorTask } from '@/render/world/worldTypes'

export const HIP = 0.42
export const SHOULDER = 0.76
export const HIP_SPREAD = 0.085
export const SHOULDER_SPREAD = 0.2
export const ARM_LENGTH = 0.36

const WHITE = '#ffffff'
const PANTS = '#4c6fa8'
const BOOTS = '#5a3d28'
const STRAW = '#e2c46a'

export type ToolKind = 'hoe' | 'can' | 'basket' | 'bucket' | 'crate'

export const TASK_TOOL: Partial<Record<ActorTask, ToolKind>> = { hoe: 'hoe', water: 'can', pick: 'basket', feed: 'bucket', carry: 'crate' }

export function legGeometry(): BufferGeometry {
  return mergeParts([part(new BoxGeometry(0.12, HIP - 0.06, 0.13), PANTS, compose([0, -(HIP - 0.06) / 2, 0])), part(new BoxGeometry(0.13, 0.07, 0.17), BOOTS, compose([0, -HIP + 0.035, 0.02]))])
}

export function armGeometry(): BufferGeometry {
  return mergeParts([part(new BoxGeometry(0.09, ARM_LENGTH - 0.06, 0.1), WHITE, compose([0, -(ARM_LENGTH - 0.06) / 2, 0])), part(new SphereGeometry(0.05, 6, 4), '#f2c7a0', compose([0, -ARM_LENGTH + 0.03, 0]))])
}

export function torsoGeometry(): BufferGeometry {
  return mergeParts([part(new BoxGeometry(0.3, 0.36, 0.18), WHITE, compose([0, 0.6, 0])), part(new BoxGeometry(0.3, 0.06, 0.19), '#6b4a2e', compose([0, HIP + 0.02, 0]))])
}

export function headGeometry(): BufferGeometry {
  return mergeParts([part(new IcosahedronGeometry(0.115, 1), WHITE, compose([0, 0.9, 0])), part(new BoxGeometry(0.06, 0.06, 0.06), WHITE, compose([0, 0.82, 0]))])
}

export function hatGeometry(): BufferGeometry {
  return mergeParts([part(new CylinderGeometry(0.2, 0.2, 0.02, 10), STRAW, compose([0, 0.99, 0])), part(new CylinderGeometry(0.09, 0.11, 0.1, 8), STRAW, compose([0, 1.04, 0])), part(new CylinderGeometry(0.111, 0.111, 0.025, 8), '#a33b2f', compose([0, 1.01, 0]))])
}

const TOOLS: Record<ToolKind, () => BufferGeometry[]> = {
  hoe: () => [part(new BoxGeometry(0.03, 0.95, 0.03), '#b98a52', compose([0, -0.05, 0.12], [0.5, 0, 0])), part(new BoxGeometry(0.16, 0.03, 0.1), '#7d868e', compose([0, -0.47, 0.38]))],
  can: () => [
    part(new CylinderGeometry(0.08, 0.09, 0.15, 7), '#4f9a3a', compose([0, -0.1, 0.03])),
    part(new CylinderGeometry(0.012, 0.02, 0.18, 5), '#3f7f2e', compose([0, -0.07, 0.15], [1.1, 0, 0])),
  ],
  basket: () => [part(new CylinderGeometry(0.11, 0.08, 0.12, 8), '#c49a5a', compose([0, -0.08, 0.02])), part(new SphereGeometry(0.07, 6, 4), '#e0473c', compose([0, -0.02, 0.02], [0, 0, 0], [1.2, 0.5, 1.2]))],
  bucket: () => [part(new CylinderGeometry(0.08, 0.065, 0.13, 8), '#9aa3ab', compose([0, -0.1, 0])), part(new CylinderGeometry(0.072, 0.072, 0.02, 8), '#e2c46a', compose([0, -0.04, 0]))],
  crate: () => [part(new BoxGeometry(0.34, 0.2, 0.26), '#b98a52', compose([0, 0, 0])), part(new BoxGeometry(0.3, 0.04, 0.22), '#e0473c', compose([0, 0.11, 0]))],
}

export function toolGeometry(kind: ToolKind): BufferGeometry {
  return mergeParts(TOOLS[kind]())
}

export const TRACTOR_WHEELS: { x: number; z: number; radius: number; width: number }[] = [
  { x: -0.36, z: -0.35, radius: 0.34, width: 0.16 },
  { x: 0.36, z: -0.35, radius: 0.34, width: 0.16 },
  { x: -0.36, z: 0.55, radius: 0.18, width: 0.12 },
  { x: 0.36, z: 0.55, radius: 0.18, width: 0.12 },
]

export const DRIVER_SEAT = { x: 0, y: 0.5, z: -0.38 }

export function tractorBodyGeometry(): BufferGeometry {
  const wheels = new Set([5, 6, 7, 8, 9, 10])
  const parts = workObjects.tractor().filter((_, index) => !wheels.has(index))
  parts.push(part(new BoxGeometry(0.3, 0.06, 0.3), '#2f2f2f', compose([-0.42, 0.62, 0])))
  return mergeParts(parts.map((piece) => piece.rotateY(-Math.PI / 2)))
}

export function wheelGeometry(): BufferGeometry {
  return mergeParts([
    part(new CylinderGeometry(1, 1, 1, 12), '#2f2f2f', compose([0, 0, 0], [0, 0, Math.PI / 2])),
    part(new CylinderGeometry(0.42, 0.42, 1.04, 8), '#f2c14e', compose([0, 0, 0], [0, 0, Math.PI / 2])),
    part(new BoxGeometry(1.06, 0.18, 1.9), '#3b3b3b', compose([0, 0, 0])),
  ])
}

export function skinTones(): string[] {
  return ['#f2c7a0', '#d9a066', '#a8714a', '#7a4e33', '#e8b98f', '#5c3a26']
}
