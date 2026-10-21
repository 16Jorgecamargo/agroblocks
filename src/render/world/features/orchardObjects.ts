import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry } from 'three'
import { compose, part } from '@/render/world/features/parts'

function crate(x: number, y: number, z: number, fruit: string, rotation = 0): BufferGeometry[] {
  return [
    part(new BoxGeometry(0.5, 0.3, 0.38), '#b98a52', compose([x, y + 0.15, z], [0, rotation, 0])),
    part(new BoxGeometry(0.44, 0.04, 0.32), fruit, compose([x, y + 0.31, z], [0, rotation, 0])),
  ]
}

function packingShed(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(2.6, 0.1, 2), '#a99a80', compose([0, 0.05, 0]))]
  for (const x of [-1.15, 1.15]) for (const z of [-0.85, 0.85]) parts.push(part(new BoxGeometry(0.12, 1.6, 0.12), '#7a5233', compose([x, 0.85, z])))
  parts.push(part(new BoxGeometry(2.8, 0.08, 1.2), '#a33b2f', compose([0, 1.85, -0.5], [-0.45, 0, 0])))
  parts.push(part(new BoxGeometry(2.8, 0.08, 1.2), '#a33b2f', compose([0, 1.85, 0.5], [0.45, 0, 0])))
  parts.push(part(new BoxGeometry(2.4, 0.5, 0.06), '#8a5a3c', compose([0, 0.35, -0.9])))
  parts.push(part(new BoxGeometry(1.4, 0.08, 0.6), '#c49a63', compose([0.3, 0.75, 0.1])))
  parts.push(...crate(-0.7, 0.1, -0.3, '#e0473c'), ...crate(-0.7, 0.42, -0.3, '#f29a2e'), ...crate(-0.2, 0.1, -0.3, '#f2c94c'), ...crate(0.6, 0.83, 0.1, '#e0473c'))
  return parts
}

function crateStack(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  const fruits = ['#e0473c', '#f29a2e', '#e0473c', '#f2c94c']
  for (let level = 0; level < 2; level += 1) {
    for (let index = 0; index < 4; index += 1) {
      if (level === 1 && index === 3) continue
      parts.push(...crate(-0.27 + (index % 2) * 0.54, level * 0.32, -0.2 + Math.floor(index / 2) * 0.4, fruits[(index + level) % 4]))
    }
  }
  return parts
}

function orchardLadder(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  for (const side of [-1, 1]) {
    for (const x of [-0.22, 0.22]) parts.push(part(new BoxGeometry(0.05, 1.7, 0.05), '#c49a63', compose([x, 0.8, side * 0.3], [side * 0.22, 0, 0])))
  }
  for (let rung = 0; rung < 5; rung += 1) parts.push(part(new BoxGeometry(0.44, 0.04, 0.04), '#b0864f', compose([0, 0.25 + rung * 0.3, 0.27 - rung * 0.055])))
  parts.push(part(new SphereGeometry(0.08, 6, 4), '#e0473c', compose([0.1, 0.05, 0.5])))
  return parts
}

function trunk(height: number): BufferGeometry {
  return part(new CylinderGeometry(0.09, 0.14, height, 6), '#7a5233', compose([0, height / 2, 0]))
}

function fruitRing(tint: string, radius: number, y: number, count: number, size = 0.09): BufferGeometry[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + 0.3
    return part(new SphereGeometry(size, 6, 4), tint, compose([Math.cos(angle) * radius, y + (index % 2) * 0.22, Math.sin(angle) * radius]))
  })
}

function pearTree(tint: string): BufferGeometry[] {
  return [trunk(0.9), part(new ConeGeometry(0.7, 1.7, 7), '#4a8f37', compose([0, 1.65, 0])), part(new IcosahedronGeometry(0.55, 0), '#57a040', compose([0, 1.2, 0])), ...fruitRing(tint === '#e0473c' ? '#c9d65a' : tint, 0.52, 1.15, 6)]
}

function peachTree(tint: string): BufferGeometry[] {
  return [
    trunk(0.8),
    part(new CylinderGeometry(0.05, 0.07, 0.6, 5), '#7a5233', compose([0.2, 0.95, 0], [0, 0, -0.6])),
    part(new CylinderGeometry(0.05, 0.07, 0.6, 5), '#7a5233', compose([-0.2, 0.95, 0.1], [0.2, 0, 0.6])),
    part(new IcosahedronGeometry(0.8, 0), '#66a842', compose([0, 1.35, 0], [0, 0, 0], [1.25, 0.65, 1.25])),
    part(new IcosahedronGeometry(0.45, 0), '#78b84c', compose([0.3, 1.65, -0.2])),
    ...fruitRing(tint === '#e0473c' ? '#f29a6a' : tint, 0.82, 1.2, 8),
  ]
}

function cherryTree(tint: string): BufferGeometry[] {
  const parts = [trunk(1.0)]
  for (const [x, y, z, size] of [
    [0, 1.45, 0, 0.55],
    [0.42, 1.25, 0.2, 0.42],
    [-0.4, 1.3, -0.15, 0.45],
    [0.05, 1.3, -0.45, 0.4],
    [-0.1, 1.85, 0.15, 0.36],
  ]) parts.push(part(new IcosahedronGeometry(size, 0), '#3f8a3a', compose([x, y, z], [x, y, z])))
  for (let index = 0; index < 10; index += 1) {
    const angle = index * 2.3
    parts.push(part(new SphereGeometry(0.06, 5, 4), tint === '#e0473c' ? '#a3203a' : tint, compose([Math.cos(angle) * 0.6, 1.05 + (index % 3) * 0.25, Math.sin(angle) * 0.6])))
  }
  return parts
}

function citrusTree(tint: string): BufferGeometry[] {
  return [trunk(0.6), part(new SphereGeometry(0.85, 8, 6), '#2f7a35', compose([0, 1.3, 0], [0, 0, 0], [1, 0.95, 1])), ...fruitRing(tint === '#e0473c' ? '#f29a2e' : tint, 0.8, 1.05, 9, 0.1), ...fruitRing(tint === '#e0473c' ? '#f2b33c' : tint, 0.55, 1.75, 5, 0.09)]
}

function sapling(): BufferGeometry[] {
  return [
    part(new CylinderGeometry(0.03, 0.04, 0.7, 5), '#7a5233', compose([0, 0.35, 0])),
    part(new BoxGeometry(0.04, 0.8, 0.04), '#c49a63', compose([0.1, 0.4, 0])),
    part(new IcosahedronGeometry(0.28, 0), '#78bf4a', compose([0, 0.85, 0])),
    part(new CylinderGeometry(0.22, 0.24, 0.05, 8), '#6b4a2e', compose([0, 0.025, 0])),
  ]
}

function berryBush(tint: string): BufferGeometry[] {
  const parts = [part(new IcosahedronGeometry(0.38, 0), '#3f7f3a', compose([0, 0.32, 0], [0, 0, 0], [1.3, 0.9, 1])), part(new IcosahedronGeometry(0.3, 0), '#4f9a3a', compose([0.35, 0.28, 0.1], [0.5, 0, 0]))]
  for (let index = 0; index < 8; index += 1) {
    const angle = index * 2.2
    parts.push(part(new SphereGeometry(0.045, 5, 4), tint === '#e0473c' ? '#5a3a8a' : tint, compose([Math.cos(angle) * 0.4 + 0.1, 0.25 + (index % 3) * 0.12, Math.sin(angle) * 0.32])))
  }
  return parts
}

function sortingTable(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(1.6, 0.08, 0.7), '#c49a63', compose([0, 0.75, 0], [0.08, 0, 0]))]
  for (const x of [-0.72, 0.72]) for (const z of [-0.28, 0.28]) parts.push(part(new BoxGeometry(0.07, 0.75, 0.07), '#6b4a2e', compose([x, 0.37, z])))
  for (const z of [-0.33, 0.33]) parts.push(part(new BoxGeometry(1.6, 0.1, 0.04), '#8a5a3c', compose([0, 0.82, z])))
  for (let index = 0; index < 9; index += 1) parts.push(part(new SphereGeometry(0.07, 6, 4), ['#e0473c', '#f29a2e', '#c9d65a'][index % 3], compose([-0.6 + index * 0.15, 0.85, (index % 2) * 0.15 - 0.05])))
  parts.push(...crate(0.4, 0, 0.55, '#e0473c', 0.2), ...crate(-0.3, 0, 0.6, '#f29a2e', -0.1))
  return parts
}

function handcart(): BufferGeometry[] {
  const parts = [part(new BoxGeometry(1.0, 0.3, 0.6), '#a33b2f', compose([0, 0.45, 0])), part(new BoxGeometry(0.9, 0.05, 0.05), '#6b4a2e', compose([-0.85, 0.5, 0.2], [0, 0, 0.15])), part(new BoxGeometry(0.9, 0.05, 0.05), '#6b4a2e', compose([-0.85, 0.5, -0.2], [0, 0, 0.15]))]
  for (const z of [-0.36, 0.36]) parts.push(part(new CylinderGeometry(0.26, 0.26, 0.06, 9), '#6b4a2e', compose([0.1, 0.26, z], [Math.PI / 2, 0, 0])))
  parts.push(...crate(0.05, 0.6, 0, '#e0473c'))
  return parts
}

export const orchardObjects = { packingShed, crateStack, orchardLadder, pearTree, peachTree, cherryTree, citrusTree, sapling, berryBush, sortingTable, handcart }
