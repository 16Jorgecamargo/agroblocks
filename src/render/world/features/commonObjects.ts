import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry } from 'three'
import { compose, part } from '@/render/world/features/parts'

const WOOD = '#8a5a3c'
const WOOD_LIGHT = '#b98a52'
const WOOD_DARK = '#6b4a2e'

function shadeTree(tint: string): BufferGeometry[] {
  return [
    part(new CylinderGeometry(0.13, 0.2, 1.3, 6), '#7a5233', compose([0, 0.65, 0])),
    part(new CylinderGeometry(0.05, 0.07, 0.6, 5), '#7a5233', compose([0.25, 1.3, 0.1], [0, 0, -0.7])),
    part(new IcosahedronGeometry(0.95, 0), tint, compose([0, 1.85, 0], [0.3, 0.4, 0])),
    part(new IcosahedronGeometry(0.62, 0), tint, compose([0.62, 1.55, 0.3], [0.1, 1.1, 0])),
    part(new IcosahedronGeometry(0.55, 0), tint, compose([-0.55, 1.6, -0.35], [0.6, 0.2, 0])),
    part(new IcosahedronGeometry(0.5, 0), tint, compose([0.1, 2.45, -0.2], [0.2, 0.9, 0.3])),
  ]
}

function bench(): BufferGeometry[] {
  const parts = [part(new BoxGeometry(1.2, 0.07, 0.36), WOOD_LIGHT, compose([0, 0.42, 0])), part(new BoxGeometry(1.2, 0.3, 0.06), WOOD_LIGHT, compose([0, 0.68, -0.17], [-0.15, 0, 0]))]
  for (const x of [-0.5, 0.5]) parts.push(part(new BoxGeometry(0.07, 0.42, 0.32), WOOD_DARK, compose([x, 0.21, 0])))
  return parts
}

function pergola(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(2.2, 0.04, 1.8), '#cdb991', compose([0, 0.02, 0]))]
  for (const x of [-0.95, 0.95]) for (const z of [-0.75, 0.75]) parts.push(part(new BoxGeometry(0.12, 1.9, 0.12), WOOD, compose([x, 0.95, z])))
  for (const z of [-0.75, 0.75]) parts.push(part(new BoxGeometry(2.4, 0.1, 0.1), WOOD, compose([0, 1.92, z])))
  for (let index = 0; index < 6; index += 1) parts.push(part(new BoxGeometry(0.06, 0.08, 1.9), WOOD_LIGHT, compose([-0.95 + index * 0.38, 2.0, 0])))
  for (const [x, z, size] of [
    [-0.8, -0.6, 0.38],
    [-0.3, 0.5, 0.32],
    [0.5, -0.2, 0.4],
    [0.9, 0.6, 0.3],
  ]) parts.push(part(new IcosahedronGeometry(size, 0), '#4f9a3a', compose([x, 2.1, z], [x, z, 0], [1, 0.55, 1])))
  for (const [x, z] of [
    [-0.95, -0.75],
    [0.95, 0.75],
  ]) parts.push(part(new CylinderGeometry(0.16, 0.2, 1.7, 5), '#5fa045', compose([x, 0.9, z])))
  for (const [x, z] of [
    [-0.75, -0.6],
    [0.6, 0.5],
  ]) parts.push(part(new SphereGeometry(0.06, 5, 4), '#c85aa8', compose([x, 2.0, z])))
  parts.push(...bench().map((piece) => piece.applyMatrix4(compose([0, 0, -0.2]))))
  return parts
}

function rainBarrel(): BufferGeometry[] {
  return [
    part(new BoxGeometry(0.7, 0.24, 0.7), '#9a9a92', compose([0, 0.12, 0])),
    part(new CylinderGeometry(0.3, 0.27, 0.75, 9), '#3f7fb0', compose([0, 0.62, 0])),
    part(new CylinderGeometry(0.31, 0.31, 0.05, 9), '#2f6690', compose([0, 1.0, 0])),
    part(new CylinderGeometry(0.31, 0.31, 0.04, 9), '#2f6690', compose([0, 0.45, 0])),
    part(new CylinderGeometry(0.03, 0.03, 0.14, 5), '#c9ced3', compose([0.3, 0.4, 0], [0, 0, Math.PI / 2])),
    part(new BoxGeometry(0.08, 1.2, 0.08), '#8d969b', compose([-0.1, 1.55, -0.2])),
    part(new BoxGeometry(0.5, 0.06, 0.06), '#8d969b', compose([-0.1, 2.12, -0.2], [0, 0.6, 0])),
  ]
}

function workbench(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(1.4, 0.08, 0.6), WOOD_LIGHT, compose([0, 0.72, 0])), part(new BoxGeometry(1.3, 0.05, 0.5), WOOD, compose([0, 0.25, 0]))]
  for (const x of [-0.62, 0.62]) for (const z of [-0.24, 0.24]) parts.push(part(new BoxGeometry(0.07, 0.72, 0.07), WOOD_DARK, compose([x, 0.36, z])))
  for (const [x, color] of [
    [-0.4, '#c9653a'],
    [-0.15, '#b65a33'],
  ] as const) parts.push(part(new CylinderGeometry(0.1, 0.07, 0.16, 7), color, compose([x, 0.84, 0.05])))
  parts.push(part(new BoxGeometry(0.3, 0.2, 0.2), '#e8dcc0', compose([0.35, 0.86, -0.05], [0, 0.3, 0])))
  parts.push(part(new BoxGeometry(0.45, 0.05, 0.12), '#6fae4a', compose([0.3, 0.79, 0.18])))
  parts.push(part(new BoxGeometry(1.3, 0.5, 0.04), WOOD, compose([0, 1.0, -0.3])))
  for (const x of [-0.4, 0, 0.4]) parts.push(part(new BoxGeometry(0.04, 0.32, 0.03), '#5f6a70', compose([x, 1.05, -0.27])))
  return parts
}

function basket(tint: string): BufferGeometry[] {
  return [
    part(new CylinderGeometry(0.22, 0.17, 0.24, 8), '#c49a5a', compose([0, 0.12, 0])),
    part(new CylinderGeometry(0.23, 0.23, 0.04, 8), '#a67c42', compose([0, 0.24, 0])),
    part(new IcosahedronGeometry(0.17, 0), tint, compose([0, 0.27, 0], [0, 0, 0], [1, 0.5, 1])),
    part(new CylinderGeometry(0.17, 0.13, 0.2, 8), '#c49a5a', compose([0.4, 0.1, 0.12])),
    part(new IcosahedronGeometry(0.13, 0), tint, compose([0.4, 0.21, 0.12], [0, 0, 0], [1, 0.5, 1])),
  ]
}

function potStack(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  for (const [x, z, y, count] of [
    [0, 0, 0, 4],
    [0.32, 0.12, 0, 2],
    [-0.3, 0.18, 0, 1],
  ]) {
    for (let level = 0; level < count; level += 1) parts.push(part(new CylinderGeometry(0.14, 0.1, 0.18, 7), level % 2 === 0 ? '#c9653a' : '#b65a33', compose([x, y + 0.09 + level * 0.1, z])))
  }
  parts.push(part(new IcosahedronGeometry(0.12, 0), '#5fa045', compose([-0.3, 0.24, 0.18])))
  return parts
}

function sackPallet(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(1.1, 0.12, 0.9), WOOD_LIGHT, compose([0, 0.06, 0]))]
  for (let level = 0; level < 2; level += 1) {
    for (let index = 0; index < (level === 0 ? 4 : 2); index += 1) {
      const x = level === 0 ? -0.26 + (index % 2) * 0.52 : -0.26 + index * 0.52
      const z = level === 0 ? -0.2 + Math.floor(index / 2) * 0.4 : 0
      parts.push(part(new BoxGeometry(0.48, 0.24, 0.36), index % 2 === 0 ? '#e8dcc0' : '#d9c9a5', compose([x, 0.24 + level * 0.24, z], [0, (index - 1) * 0.08, 0])))
    }
  }
  return parts
}

function reeds(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  for (let index = 0; index < 9; index += 1) {
    const angle = index * 2.4
    const radius = 0.08 + (index % 3) * 0.1
    const height = 0.55 + (index % 4) * 0.15
    parts.push(part(new ConeGeometry(0.04, height, 3), index % 2 === 0 ? '#6f9a3c' : '#86ad4a', compose([Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius], [Math.sin(angle) * 0.15, 0, Math.cos(angle) * 0.15])))
    if (index % 3 === 0) parts.push(part(new CylinderGeometry(0.035, 0.035, 0.14, 5), '#7a5233', compose([Math.cos(angle) * radius, height * 0.85, Math.sin(angle) * radius])))
  }
  return parts
}

function fallenFruit(tint: string): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  for (let index = 0; index < 7; index += 1) {
    const angle = index * 2.1
    const radius = 0.12 + (index % 3) * 0.17
    parts.push(part(new SphereGeometry(0.07, 6, 4), tint, compose([Math.cos(angle) * radius, 0.06, Math.sin(angle) * radius])))
  }
  for (let index = 0; index < 4; index += 1) parts.push(part(new BoxGeometry(0.12, 0.01, 0.07), '#8aa63c', compose([Math.cos(index * 1.7) * 0.4, 0.01, Math.sin(index * 1.7) * 0.4], [0, index, 0])))
  return parts
}

function barrels(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  for (const [x, z, color] of [
    [0, 0, '#8a5a3c'],
    [0.5, 0.15, '#7a4e33'],
    [0.2, 0.5, '#4c78a8'],
  ] as const) {
    parts.push(part(new CylinderGeometry(0.22, 0.24, 0.6, 8), color, compose([x, 0.3, z])))
    for (const y of [0.12, 0.48]) parts.push(part(new CylinderGeometry(0.245, 0.245, 0.04, 8), '#5f6a70', compose([x, y, z])))
  }
  return parts
}

function supplyTank(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(1.5, 0.08, 0.9), '#a99a80', compose([0, 0.04, 0]))]
  for (const x of [-0.45, 0.45]) parts.push(part(new BoxGeometry(0.12, 0.42, 0.7), '#5f6a70', compose([x, 0.25, 0])))
  parts.push(part(new CylinderGeometry(0.36, 0.36, 1.3, 10), '#e9ece6', compose([0, 0.72, 0], [0, 0, Math.PI / 2])))
  parts.push(part(new CylinderGeometry(0.37, 0.37, 0.06, 10), '#3f8f3a', compose([0.3, 0.72, 0], [0, 0, Math.PI / 2])))
  parts.push(part(new CylinderGeometry(0.37, 0.37, 0.06, 10), '#3f8f3a', compose([-0.3, 0.72, 0], [0, 0, Math.PI / 2])))
  parts.push(part(new CylinderGeometry(0.08, 0.08, 0.14, 6), '#5f6a70', compose([0, 1.12, 0])))
  for (const x of [-0.72, 0.72]) for (const z of [-0.42, 0.42]) parts.push(part(new BoxGeometry(0.06, 0.6, 0.06), '#e0b33c', compose([x, 0.3, z])))
  return parts
}

export const commonObjects = { shadeTree, bench, pergola, rainBarrel, workbench, basket, potStack, sackPallet, reeds, fallenFruit, barrels, supplyTank }
