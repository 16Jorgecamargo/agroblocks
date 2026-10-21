import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, SphereGeometry } from 'three'
import { compose, part } from '@/render/world/features/parts'

function feedShed(): BufferGeometry[] {
  const parts: BufferGeometry[] = [
    part(new BoxGeometry(2.4, 0.08, 1.6), '#a99a80', compose([0, 0.04, 0])),
    part(new BoxGeometry(2.4, 1.6, 0.1), '#8a5a3c', compose([0, 0.8, -0.75])),
    part(new BoxGeometry(0.1, 1.4, 1.5), '#8a5a3c', compose([-1.15, 0.7, 0])),
    part(new BoxGeometry(0.1, 1.4, 1.5), '#8a5a3c', compose([1.15, 0.7, 0])),
    part(new BoxGeometry(2.7, 0.08, 1.9), '#6b6f73', compose([0, 1.62, 0], [0.18, 0, 0])),
  ]
  for (const x of [-1.15, 1.15]) parts.push(part(new BoxGeometry(0.1, 1.4, 0.1), '#6b4a2e', compose([x, 0.7, 0.72])))
  for (let index = 0; index < 5; index += 1) parts.push(part(new BoxGeometry(0.34, 0.42, 0.28), index % 2 === 0 ? '#e8dcc0' : '#d9c9a5', compose([-0.8 + index * 0.4, 0.29, -0.4], [0, index * 0.2, 0])))
  parts.push(part(new BoxGeometry(0.34, 0.42, 0.28), '#e8dcc0', compose([-0.6, 0.71, -0.42], [0, 0.4, 0])))
  return parts
}

function baleStack(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  const rows: [number, number][] = [
    [3, 0],
    [2, 1],
    [1, 2],
  ]
  for (const [count, level] of rows) {
    for (let index = 0; index < count; index += 1) {
      const x = (index - (count - 1) / 2) * 0.82
      parts.push(part(new CylinderGeometry(0.42, 0.42, 0.8, 10), '#e2c46a', compose([x, 0.42 + level * 0.72, 0], [Math.PI / 2, 0, 0])))
      parts.push(part(new CylinderGeometry(0.3, 0.3, 0.81, 10), '#d4b45a', compose([x, 0.42 + level * 0.72, 0], [Math.PI / 2, 0, 0])))
    }
  }
  return parts
}

function animalShelter(tint: string): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(2.0, 0.05, 1.4), '#d9c682', compose([0, 0.025, 0])), part(new BoxGeometry(2.0, 1.1, 0.08), '#8a5a3c', compose([0, 0.55, -0.66]))]
  for (const x of [-0.96, 0.96]) parts.push(part(new BoxGeometry(0.08, 1.0, 1.32), '#8a5a3c', compose([x, 0.5, 0])))
  for (const x of [-0.96, 0.96]) parts.push(part(new BoxGeometry(0.1, 0.85, 0.1), '#6b4a2e', compose([x, 0.42, 0.66])))
  parts.push(part(new BoxGeometry(2.3, 0.08, 1.7), tint, compose([0, 1.02, 0], [0.22, 0, 0])))
  for (let index = 0; index < 3; index += 1) parts.push(part(new BoxGeometry(0.5, 0.08, 0.4), '#e2c46a', compose([-0.5 + index * 0.5, 0.06, -0.3 + (index % 2) * 0.3], [0, index, 0])))
  return parts
}

function hayRack(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(1.4, 0.35, 0.6), '#e2c46a', compose([0, 0.8, 0])), part(new BoxGeometry(1.3, 0.06, 0.55), '#8a6a4a', compose([0, 0.35, 0]))]
  for (const x of [-0.65, 0.65]) for (const z of [-0.25, 0.25]) parts.push(part(new BoxGeometry(0.07, 1.0, 0.07), '#6b4a2e', compose([x, 0.5, z])))
  for (let index = 0; index < 7; index += 1) {
    parts.push(part(new BoxGeometry(0.03, 0.5, 0.03), '#8a5a3c', compose([-0.6 + index * 0.2, 0.75, 0.3], [-0.3, 0, 0])))
    parts.push(part(new BoxGeometry(0.03, 0.5, 0.03), '#8a5a3c', compose([-0.6 + index * 0.2, 0.75, -0.3], [0.3, 0, 0])))
  }
  return parts
}

function nestBoxes(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(1.2, 0.5, 0.45), '#b98a52', compose([0, 0.45, 0])), part(new BoxGeometry(1.3, 0.06, 0.55), '#a33b2f', compose([0, 0.73, 0], [0.25, 0, 0]))]
  for (const x of [-0.6, 0.6]) parts.push(part(new BoxGeometry(0.06, 0.25, 0.06), '#6b4a2e', compose([x, 0.1, 0.18])))
  for (const x of [-0.4, 0, 0.4]) {
    parts.push(part(new BoxGeometry(0.3, 0.3, 0.02), '#4a3626', compose([x, 0.45, 0.23])))
    parts.push(part(new BoxGeometry(0.26, 0.04, 0.1), '#e2c46a', compose([x, 0.32, 0.26])))
  }
  parts.push(part(new SphereGeometry(0.05, 5, 4), '#f4efe2', compose([0, 0.36, 0.28], [0, 0, 0], [1, 1.25, 1])))
  return parts
}

function equipmentRack(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(1.6, 0.08, 0.08), '#6b4a2e', compose([0, 1.2, 0])), part(new BoxGeometry(1.6, 0.08, 0.08), '#6b4a2e', compose([0, 0.6, 0]))]
  for (const x of [-0.75, 0.75]) parts.push(part(new BoxGeometry(0.1, 1.3, 0.1), '#6b4a2e', compose([x, 0.65, 0])))
  for (const [x, tilt] of [
    [-0.45, 0.1],
    [-0.15, -0.08],
    [0.2, 0.06],
    [0.5, -0.1],
  ]) {
    parts.push(part(new BoxGeometry(0.04, 1.2, 0.04), '#c49a63', compose([x, 0.7, 0.08], [0, 0, tilt])))
    parts.push(part(new BoxGeometry(0.2, 0.18, 0.03), '#7d868e', compose([x, 1.32, 0.08], [0, 0, tilt])))
  }
  parts.push(part(new CylinderGeometry(0.16, 0.14, 0.3, 8), '#9aa3ab', compose([0.9, 0.15, 0.25])))
  parts.push(part(new ConeGeometry(0.06, 0.1, 6), '#7d868e', compose([-0.95, 0.05, 0.3])))
  return parts
}

export const barnyardObjects = { feedShed, baleStack, animalShelter, hayRack, nestBoxes, equipmentRack }
