import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry } from 'three'
import { compose, part } from '@/render/world/features/parts'

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
    part(new BoxGeometry(1.8, 0.08, 0.75), '#5d7a3a', compose([0, 1.5, -0.32], [0.62, 0, 0])),
    part(new BoxGeometry(1.8, 0.08, 0.75), '#5d7a3a', compose([0, 1.5, 0.32], [-0.62, 0, 0])),
    part(new BoxGeometry(1.6, 0.42, 0.02), '#9c6b43', compose([0, 1.42, 0], [0, 0, 0], [1, 1, 50])),
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

export const gardenObjects = { toolShed, compostBins, wateringCan, chicken }
