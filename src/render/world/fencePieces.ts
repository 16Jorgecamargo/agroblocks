import type { PropItem } from '@/render/world/worldTypes'

export type FencePieceKind = 'post' | 'gatePost' | 'rail' | 'brace'

export interface FencePiece {
  kind: FencePieceKind
  x: number
  y: number
  z: number
  rotation: number
  length: number
  tilt: number
  size: number
}

export const FENCE = {
  postHeight: 0.55,
  gatePostHeight: 0.7,
  postSize: 0.1,
  railHeights: [0.2, 0.42],
  railThickness: 0.06,
  railDepth: 0.08,
  braceRise: 0.22,
} as const

function postKey(x: number, z: number): string {
  return `${Math.round(x * 100)}:${Math.round(z * 100)}`
}

export function fencePieces(props: PropItem[]): FencePiece[] {
  const posts = new Map<string, FencePiece>()
  const spans: FencePiece[] = []
  for (const prop of props) {
    if (prop.model !== 'fence' && prop.model !== 'fence-gate') continue
    const gate = prop.model === 'fence-gate'
    const length = prop.scale
    const size = Math.min(1, prop.scale)
    const dx = Math.cos(prop.rotation) * (length / 2)
    const dz = -Math.sin(prop.rotation) * (length / 2)
    for (const [x, z] of [
      [prop.x - dx, prop.z - dz],
      [prop.x + dx, prop.z + dz],
    ]) {
      const key = postKey(x, z)
      const existing = posts.get(key)
      if (existing && (existing.kind === 'gatePost' || !gate)) continue
      posts.set(key, { kind: gate ? 'gatePost' : 'post', x, y: 0, z, rotation: prop.rotation, length: 0, tilt: 0, size })
    }
    for (const height of FENCE.railHeights) {
      spans.push({ kind: 'rail', x: prop.x, y: height * size, z: prop.z, rotation: prop.rotation, length, tilt: 0, size })
    }
    if (gate) {
      const tilt = Math.atan2(FENCE.braceRise * size, length)
      const braceLength = Math.hypot(length, FENCE.braceRise * size)
      const middle = ((FENCE.railHeights[0] + FENCE.railHeights[1]) / 2) * size
      spans.push({ kind: 'brace', x: prop.x, y: middle, z: prop.z, rotation: prop.rotation, length: braceLength, tilt, size })
      spans.push({ kind: 'brace', x: prop.x, y: middle, z: prop.z, rotation: prop.rotation, length: braceLength, tilt: -tilt, size })
    }
  }
  return [...posts.values(), ...spans]
}
