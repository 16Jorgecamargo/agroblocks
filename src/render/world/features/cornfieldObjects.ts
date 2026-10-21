import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry } from 'three'
import { compose, part } from '@/render/world/features/parts'

function grainBin(): BufferGeometry[] {
  const parts = [part(new CylinderGeometry(0.9, 0.9, 2.2, 8), '#c9ced3', compose([0, 1.1, 0]))]
  for (const y of [0.5, 1.1, 1.7]) parts.push(part(new CylinderGeometry(0.93, 0.93, 0.06, 8), '#9aa3ab', compose([0, y, 0])))
  parts.push(part(new ConeGeometry(0.98, 0.6, 8), '#b4bcc4', compose([0, 2.5, 0])))
  parts.push(part(new CylinderGeometry(0.15, 0.15, 0.12, 8), '#9aa3ab', compose([0, 2.86, 0])))
  for (const z of [-0.12, 0.12]) parts.push(part(new BoxGeometry(0.04, 2.3, 0.04), '#7d868e', compose([0.95, 1.15, z])))
  for (let rung = 0; rung < 6; rung += 1) parts.push(part(new BoxGeometry(0.04, 0.04, 0.24), '#7d868e', compose([0.95, 0.3 + rung * 0.36, 0])))
  return parts
}

function grainDryer(): BufferGeometry[] {
  return [
    part(new BoxGeometry(1.4, 0.15, 1.4), '#8a8a82', compose([0, 0.075, 0])),
    part(new BoxGeometry(1.2, 3.2, 1.2), '#d9d9d0', compose([0, 1.6, 0])),
    part(new BoxGeometry(1.35, 0.3, 1.35), '#a33b2f', compose([0, 3.35, 0])),
    part(new BoxGeometry(0.3, 1.6, 0.3), '#b4bcc4', compose([0.85, 2.0, 0], [0, 0, -0.5])),
  ]
}

function cornWagon(): BufferGeometry[] {
  const parts = [part(new BoxGeometry(1.4, 0.35, 0.8), '#a33b2f', compose([0, 0.55, 0])), part(new BoxGeometry(0.6, 0.05, 0.05), '#6b4a2e', compose([-0.95, 0.4, 0]))]
  for (const x of [-0.45, 0.45]) for (const z of [-0.42, 0.42]) parts.push(part(new CylinderGeometry(0.25, 0.25, 0.08, 8), '#3b3b3b', compose([x, 0.25, z], [Math.PI / 2, 0, 0])))
  for (let index = 0; index < 8; index += 1) {
    parts.push(part(new CylinderGeometry(0.06, 0.07, 0.22, 5), index % 3 === 0 ? '#e8b33c' : '#f2c14e', compose([-0.45 + (index % 4) * 0.3, 0.8 + Math.floor(index / 4) * 0.08, index < 4 ? -0.15 : 0.15], [0, index * 0.4, Math.PI / 2])))
  }
  return parts
}

function scarecrow(): BufferGeometry[] {
  return [
    part(new BoxGeometry(0.08, 1.6, 0.08), '#7a5233', compose([0, 0.8, 0])),
    part(new BoxGeometry(1.0, 0.07, 0.07), '#7a5233', compose([0, 1.15, 0])),
    part(new BoxGeometry(0.55, 0.5, 0.25), '#4c78a8', compose([0, 1.05, 0])),
    part(new IcosahedronGeometry(0.17, 0), '#e2c46a', compose([0, 1.5, 0])),
    part(new CylinderGeometry(0.3, 0.3, 0.03, 8), '#a07a3a', compose([0, 1.65, 0])),
    part(new ConeGeometry(0.16, 0.22, 8), '#a07a3a', compose([0, 1.77, 0])),
  ]
}

export const cornfieldObjects = { grainBin, grainDryer, cornWagon, scarecrow }
