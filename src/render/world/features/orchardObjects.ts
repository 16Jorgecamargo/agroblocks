import { BoxGeometry, type BufferGeometry, SphereGeometry } from 'three'
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
  parts.push(part(new BoxGeometry(2.8, 0.08, 1.2), '#a33b2f', compose([0, 1.85, -0.5], [0.45, 0, 0])))
  parts.push(part(new BoxGeometry(2.8, 0.08, 1.2), '#a33b2f', compose([0, 1.85, 0.5], [-0.45, 0, 0])))
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

export const orchardObjects = { packingShed, crateStack, orchardLadder }
