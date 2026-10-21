import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry } from 'three'
import { compose, gable, part } from '@/render/world/features/parts'

function wateringCanParts(x: number, z: number, rotation: number): BufferGeometry[] {
  return [
    part(new CylinderGeometry(0.11, 0.12, 0.2, 7), '#4f9a3a', compose([x, 0.1, z], [0, rotation, 0])),
    part(new CylinderGeometry(0.015, 0.025, 0.22, 5), '#3f7f2e', compose([x + 0.14 * Math.cos(rotation), 0.16, z - 0.14 * Math.sin(rotation)], [0, rotation, -0.9])),
    part(new BoxGeometry(0.03, 0.1, 0.12), '#3f7f2e', compose([x, 0.25, z], [0, rotation, 0])),
  ]
}

function toolShed(): BufferGeometry[] {
  return [
    part(new BoxGeometry(1.6, 1.3, 1.2), '#9c6b43', compose([0, 0.65, 0])),
    part(new BoxGeometry(1.8, 0.08, 0.75), '#5d7a3a', compose([0, 1.56, -0.32], [-0.62, 0, 0])),
    part(new BoxGeometry(1.8, 0.08, 0.75), '#5d7a3a', compose([0, 1.56, 0.32], [0.62, 0, 0])),
    part(gable(1.6, 0.44, 1.2), '#9c6b43', compose([0, 1.3, 0])),
    part(new BoxGeometry(0.5, 0.9, 0.04), '#6b4a2e', compose([0.2, 0.45, 0.61])),
    part(new BoxGeometry(0.34, 0.26, 0.04), '#cfe6f0', compose([-0.45, 0.85, 0.61])),
    ...wateringCanParts(-0.5, 0.85, 0.4),
    ...wateringCanParts(0.85, 0.75, -0.6),
  ]
}

function compostBins(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  for (const x of [-0.6, 0, 0.6]) {
    parts.push(part(new BoxGeometry(0.55, 0.32, 0.55), '#4a3626', compose([x, 0.16, 0])))
    for (const [dx, dz, width, depth] of [
      [0, -0.29, 0.6, 0.04],
      [0, 0.29, 0.6, 0.04],
      [-0.29, 0, 0.04, 0.6],
      [0.29, 0, 0.04, 0.6],
    ]) {
      for (const y of [0.1, 0.27, 0.44]) parts.push(part(new BoxGeometry(width, 0.1, depth), '#8a6448', compose([x + dx, y, dz])))
    }
  }
  return parts
}

function wateringCan(): BufferGeometry[] {
  return wateringCanParts(0, 0, 0)
}

function chicken(): BufferGeometry[] {
  return [
    part(new SphereGeometry(0.14, 6, 4), '#f4f1e8', compose([0, 0.2, 0], [0, 0, 0], [1.25, 1, 1])),
    part(new IcosahedronGeometry(0.08, 0), '#f4f1e8', compose([0.15, 0.33, 0])),
    part(new BoxGeometry(0.04, 0.06, 0.03), '#d9473c', compose([0.16, 0.42, 0])),
    part(new ConeGeometry(0.03, 0.07, 4), '#f2b134', compose([0.24, 0.32, 0], [0, 0, -Math.PI / 2])),
    part(new ConeGeometry(0.07, 0.14, 4), '#e8e2d4', compose([-0.17, 0.27, 0], [0, 0, 0.9])),
    part(new CylinderGeometry(0.012, 0.012, 0.08, 4), '#f2b134', compose([0, 0.04, 0.05])),
    part(new CylinderGeometry(0.012, 0.012, 0.08, 4), '#f2b134', compose([0, 0.04, -0.05])),
  ]
}

function bedFrame(): BufferGeometry[] {
  return [part(new BoxGeometry(1.4, 0.24, 0.8), '#7a5233', compose([0, 0.12, 0])), part(new BoxGeometry(1.3, 0.04, 0.7), '#5a3d28', compose([0, 0.24, 0]))]
}

function bedGrid(build: (x: number, z: number, index: number) => BufferGeometry[]): BufferGeometry[] {
  const parts = bedFrame()
  for (let index = 0; index < 8; index += 1) parts.push(...build(-0.5 + (index % 4) * 0.33, index < 4 ? -0.17 : 0.17, index))
  return parts
}

function cabbageBed(): BufferGeometry[] {
  return bedGrid((x, z, index) => [
    part(new IcosahedronGeometry(0.13, 0), index % 3 === 0 ? '#9fd27a' : '#b5dc8e', compose([x, 0.34, z], [index, index, 0])),
    part(new ConeGeometry(0.15, 0.06, 5), '#5f9e44', compose([x, 0.28, z], [0, index, 0])),
  ])
}

function carrotBed(): BufferGeometry[] {
  return bedGrid((x, z, index) => [
    part(new ConeGeometry(0.035, 0.08, 5), '#e8792e', compose([x, 0.27, z], [Math.PI, 0, 0])),
    part(new ConeGeometry(0.06, 0.24, 4), '#5fae3b', compose([x - 0.03, 0.4, z], [0.3, index, 0.2])),
    part(new ConeGeometry(0.05, 0.2, 4), '#78bf4a', compose([x + 0.03, 0.38, z], [-0.3, index, -0.25])),
  ])
}

function tomatoBed(): BufferGeometry[] {
  const parts = bedFrame()
  for (const x of [-0.45, 0, 0.45]) {
    parts.push(part(new BoxGeometry(0.03, 0.95, 0.03), '#c49a63', compose([x, 0.7, 0])))
    parts.push(part(new IcosahedronGeometry(0.2, 0), '#3f8f3a', compose([x, 0.62, 0], [0, x, 0], [1, 1.5, 1])))
    parts.push(part(new IcosahedronGeometry(0.15, 0), '#4f9a3a', compose([x, 0.95, 0], [x, 0, 0])))
    for (const [dx, dy, dz] of [
      [0.12, 0.55, 0.1],
      [-0.1, 0.72, 0.12],
      [0.08, 0.86, -0.1],
    ]) parts.push(part(new SphereGeometry(0.055, 6, 4), dy > 0.8 ? '#f2a03c' : '#e0473c', compose([x + dx, dy, dz])))
  }
  return parts
}

function pepperBed(): BufferGeometry[] {
  return bedGrid((x, z, index) => [
    part(new IcosahedronGeometry(0.12, 0), '#4f9a3a', compose([x, 0.4, z], [index, 0, 0], [1, 1.3, 1])),
    part(new ConeGeometry(0.04, 0.12, 5), index % 2 === 0 ? '#d9473c' : '#f2c14e', compose([x + 0.07, 0.36, z + 0.05], [Math.PI, 0, 0])),
  ])
}

function onionBed(): BufferGeometry[] {
  return bedGrid((x, z, index) => [
    part(new SphereGeometry(0.06, 6, 4), index % 2 === 0 ? '#efe2c4' : '#c47a8a', compose([x, 0.3, z])),
    part(new ConeGeometry(0.018, 0.3, 3), '#6fae3b', compose([x, 0.48, z])),
    part(new ConeGeometry(0.018, 0.26, 3), '#86bf4a', compose([x + 0.03, 0.45, z], [0, 0, -0.25])),
  ])
}

function herbBed(): BufferGeometry[] {
  const colors = ['#6fae4a', '#8fbf6a', '#7c6fb0', '#5f9e44']
  return bedGrid((x, z, index) => [part(new IcosahedronGeometry(0.11 + (index % 2) * 0.03, 0), colors[index % 4], compose([x, 0.33, z], [index, index * 0.5, 0], [1, 0.9, 1]))])
}

function sproutBed(): BufferGeometry[] {
  const parts = bedFrame()
  for (let index = 0; index < 15; index += 1) parts.push(part(new ConeGeometry(0.035, 0.12, 4), '#8fd45a', compose([-0.56 + (index % 5) * 0.28, 0.32, -0.22 + Math.floor(index / 5) * 0.22], [0, index, 0])))
  return parts
}

function beanTrellis(): BufferGeometry[] {
  const parts = bedFrame()
  for (const x of [-0.55, -0.18, 0.18, 0.55]) {
    parts.push(part(new BoxGeometry(0.03, 1.3, 0.03), '#c49a63', compose([x, 0.85, -0.15], [0.18, 0, 0])))
    parts.push(part(new BoxGeometry(0.03, 1.3, 0.03), '#c49a63', compose([x, 0.85, 0.15], [-0.18, 0, 0])))
    parts.push(part(new CylinderGeometry(0.09, 0.14, 1.05, 5), x > 0 ? '#4f9a3a' : '#5fae45', compose([x, 0.8, 0])))
  }
  parts.push(part(new BoxGeometry(1.3, 0.03, 0.03), '#c49a63', compose([0, 1.48, 0])))
  for (const x of [-0.4, 0.3]) parts.push(part(new BoxGeometry(0.03, 0.16, 0.03), '#3f7f2e', compose([x, 0.9, 0.1])))
  return parts
}

function seedlingTable(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(1.6, 0.06, 0.7), '#b98a52', compose([0, 0.62, 0]))]
  for (const x of [-0.72, 0.72]) for (const z of [-0.28, 0.28]) parts.push(part(new BoxGeometry(0.06, 0.62, 0.06), '#6b4a2e', compose([x, 0.31, z])))
  for (const x of [-0.5, 0, 0.5]) {
    parts.push(part(new BoxGeometry(0.42, 0.06, 0.55), '#3b3b3b', compose([x, 0.68, 0])))
    for (let index = 0; index < 6; index += 1) parts.push(part(new ConeGeometry(0.04, 0.1, 4), '#8fd45a', compose([x - 0.12 + (index % 3) * 0.12, 0.76, -0.14 + Math.floor(index / 3) * 0.28])))
  }
  parts.push(part(new BoxGeometry(1.4, 0.05, 0.55), '#b98a52', compose([0, 0.2, 0])))
  for (const x of [-0.4, 0.15]) parts.push(part(new BoxGeometry(0.4, 0.06, 0.5), '#3b3b3b', compose([x, 0.26, 0])))
  return parts
}

export const gardenObjects = { toolShed, compostBins, wateringCan, chicken, cabbageBed, carrotBed, tomatoBed, pepperBed, onionBed, herbBed, sproutBed, beanTrellis, seedlingTable }
