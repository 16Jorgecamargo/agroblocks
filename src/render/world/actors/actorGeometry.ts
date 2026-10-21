import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry, Vector3 } from 'three'
import { compose, mergeParts, part } from '@/render/world/features/parts'
import type { ActorTask } from '@/render/world/worldTypes'

export const HIP = 0.42
export const SHOULDER = 0.76
export const HIP_SPREAD = 0.085
export const SHOULDER_SPREAD = 0.2
export const ARM_LENGTH = 0.36
export const HOE_HANDLE = 0.62
export const HOE_BUTT = 0.26

const WHITE = '#ffffff'
const PANTS = '#4c6fa8'
const BOOTS = '#5a3d28'
const STRAW = '#e2c46a'

const SPOUT_TILT = 1.05
const SPOUT_LENGTH = 0.2
const SPOUT_BASE = new Vector3(0, -0.15, 0.08)
const SPOUT_DIRECTION = new Vector3(0, Math.cos(SPOUT_TILT), Math.sin(SPOUT_TILT))

export const CAN_SPOUT = { tip: SPOUT_BASE.clone().addScaledVector(SPOUT_DIRECTION, SPOUT_LENGTH), direction: SPOUT_DIRECTION.clone() }

export const STREAM_LENGTH = 0.4

export function streamGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = []
  for (let index = 0; index < 7; index += 1) {
    const t = index / 6
    parts.push(part(new SphereGeometry(0.018 + t * 0.008, 5, 4), '#7cc4f0', compose([Math.sin(index * 2.3) * 0.015 * t, -STREAM_LENGTH * t, 0.02 * t], [0, 0, 0], [1, 1.6, 1])))
  }
  parts.push(part(new CylinderGeometry(0.07, 0.07, 0.005, 8), '#9fd4f2', compose([0, -STREAM_LENGTH, 0.02])))
  return mergeParts(parts)
}

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
  hoe: () => [
    part(new BoxGeometry(0.03, HOE_HANDLE + HOE_BUTT, 0.03), '#b98a52', compose([0, (HOE_BUTT - HOE_HANDLE) / 2, 0])),
    part(new BoxGeometry(0.04, 0.05, 0.04), '#5f666d', compose([0, -HOE_HANDLE, -0.01])),
    part(new BoxGeometry(0.17, 0.025, 0.13), '#7d868e', compose([0, -HOE_HANDLE, -0.07])),
  ],
  can: () => [
    part(new BoxGeometry(0.03, 0.03, 0.14), '#3f7f2e', compose([0, 0, 0])),
    part(new BoxGeometry(0.03, 0.05, 0.03), '#3f7f2e', compose([0, -0.025, -0.06])),
    part(new BoxGeometry(0.03, 0.05, 0.03), '#3f7f2e', compose([0, -0.025, 0.06])),
    part(new CylinderGeometry(0.08, 0.09, 0.16, 8), '#4f9a3a', compose([0, -0.12, 0])),
    part(new CylinderGeometry(0.012, 0.02, SPOUT_LENGTH, 5), '#3f7f2e', compose([0, SPOUT_BASE.y + SPOUT_DIRECTION.y * SPOUT_LENGTH / 2, SPOUT_BASE.z + SPOUT_DIRECTION.z * SPOUT_LENGTH / 2], [SPOUT_TILT, 0, 0])),
    part(new ConeGeometry(0.035, 0.04, 6), '#3f7f2e', compose([0, SPOUT_BASE.y + SPOUT_DIRECTION.y * SPOUT_LENGTH, SPOUT_BASE.z + SPOUT_DIRECTION.z * SPOUT_LENGTH], [SPOUT_TILT + Math.PI, 0, 0])),
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

export const DRIVER_SEAT = { x: 0, y: 0.22, z: -0.42 }

const TRACTOR_GREEN = '#3f8f3a'
const TRACTOR_YELLOW = '#f2c14e'
const TRACTOR_DARK = '#2f2f2f'

export function tractorBodyGeometry(): BufferGeometry {
  return mergeParts([
    part(new BoxGeometry(0.5, 0.4, 0.85), TRACTOR_GREEN, compose([0, 0.5, 0.375])),
    part(new BoxGeometry(0.44, 0.3, 0.02), TRACTOR_DARK, compose([0, 0.5, 0.805])),
    part(new BoxGeometry(0.08, 0.06, 0.03), TRACTOR_YELLOW, compose([-0.17, 0.63, 0.8])),
    part(new BoxGeometry(0.08, 0.06, 0.03), TRACTOR_YELLOW, compose([0.17, 0.63, 0.8])),
    part(new CylinderGeometry(0.035, 0.035, 0.45, 6), TRACTOR_DARK, compose([0.15, 0.9, 0.55])),
    part(new BoxGeometry(0.44, 0.22, 0.1), TRACTOR_GREEN, compose([0, 0.79, 0])),
    part(new CylinderGeometry(0.02, 0.02, 0.16, 5), TRACTOR_DARK, compose([0, 0.84, -0.07], [-1.2, 0, 0])),
    part(new CylinderGeometry(0.13, 0.13, 0.02, 12), TRACTOR_DARK, compose([0, 0.87, -0.14], [-0.6, 0, 0])),
    part(new BoxGeometry(0.56, 0.12, 0.45), TRACTOR_GREEN, compose([0, 0.42, -0.4])),
    part(new BoxGeometry(0.56, 0.03, 0.3), TRACTOR_DARK, compose([0, 0.38, -0.18])),
    part(new BoxGeometry(0.66, 0.05, 0.05), TRACTOR_DARK, compose([0, 0.18, 0.55])),
    part(new BoxGeometry(0.6, 0.06, 0.06), TRACTOR_DARK, compose([0, 0.34, -0.35])),
    part(new BoxGeometry(0.2, 0.04, 0.55), TRACTOR_GREEN, compose([-0.36, 0.72, -0.35])),
    part(new BoxGeometry(0.2, 0.04, 0.55), TRACTOR_GREEN, compose([0.36, 0.72, -0.35])),
    part(new BoxGeometry(0.08, 0.06, 0.08), TRACTOR_DARK, compose([0, 0.5, -0.42])),
    part(new BoxGeometry(0.3, 0.06, 0.28), TRACTOR_DARK, compose([0, 0.55, -0.42])),
    part(new BoxGeometry(0.3, 0.3, 0.05), TRACTOR_DARK, compose([0, 0.72, -0.58])),
    part(new BoxGeometry(0.05, 0.97, 0.05), TRACTOR_DARK, compose([-0.24, 0.965, -0.6])),
    part(new BoxGeometry(0.05, 0.97, 0.05), TRACTOR_DARK, compose([0.24, 0.965, -0.6])),
    part(new BoxGeometry(0.7, 0.04, 0.75), TRACTOR_YELLOW, compose([0, 1.47, -0.35])),
  ])
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
