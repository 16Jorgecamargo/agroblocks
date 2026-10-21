import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry } from 'three'
import { compose, part } from '@/render/world/features/parts'
import { workObjects } from '@/render/world/features/workObjects'

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

function trailer(): BufferGeometry[] {
  const parts = [part(new BoxGeometry(1.5, 0.08, 0.9), '#6b4a2e', compose([0, 0.45, 0])), part(new BoxGeometry(0.7, 0.05, 0.05), '#5f6a70', compose([-1.05, 0.38, 0]))]
  for (const z of [-0.43, 0.43]) parts.push(part(new BoxGeometry(1.5, 0.3, 0.05), '#c9653a', compose([0, 0.64, z])))
  for (const x of [-0.73, 0.73]) parts.push(part(new BoxGeometry(0.05, 0.3, 0.9), '#c9653a', compose([x, 0.64, 0])))
  for (const z of [-0.5, 0.5]) parts.push(part(new CylinderGeometry(0.24, 0.24, 0.1, 9), '#2f2f2f', compose([0.1, 0.24, z], [Math.PI / 2, 0, 0])))
  return parts
}

function plow(): BufferGeometry[] {
  const parts = [part(new BoxGeometry(1.2, 0.08, 0.1), '#a33b2f', compose([0, 0.45, 0])), part(new BoxGeometry(0.1, 0.08, 0.6), '#a33b2f', compose([-0.55, 0.45, 0.3]))]
  for (const x of [-0.4, 0, 0.4]) {
    parts.push(part(new BoxGeometry(0.06, 0.4, 0.06), '#7d868e', compose([x, 0.25, 0])))
    parts.push(part(new ConeGeometry(0.1, 0.28, 4), '#9aa3ab', compose([x, 0.08, 0.06], [Math.PI / 2, 0, 0])))
  }
  return parts
}

function machineShed(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(4.4, 0.06, 2.8), '#a99a80', compose([0, 0.03, 0])), part(new BoxGeometry(4.4, 2.0, 0.1), '#9a4a36', compose([0, 1.0, -1.35]))]
  for (const x of [-2.15, -0.7, 0.7, 2.15]) parts.push(part(new BoxGeometry(0.14, 2.0, 0.14), '#7a5233', compose([x, 1.0, 1.3])))
  parts.push(part(new BoxGeometry(0.1, 2.0, 2.7), '#9a4a36', compose([-2.15, 1.0, 0])))
  parts.push(part(new BoxGeometry(4.7, 0.1, 3.2), '#7d868e', compose([0, 2.22, 0], [0.12, 0, 0])))
  for (const x of [-1.6, -0.6, 0.4, 1.4]) parts.push(part(new BoxGeometry(0.04, 0.12, 3.2), '#6b737a', compose([x, 2.28, 0], [0.12, 0, 0])))
  parts.push(...workObjects.tractor().map((piece) => piece.applyMatrix4(compose([-1.1, 0.03, 0.2], [0, Math.PI / 2, 0]))))
  parts.push(...trailer().map((piece) => piece.applyMatrix4(compose([0.85, 0.03, -0.3], [0, 0.1, 0]))))
  parts.push(...plow().map((piece) => piece.applyMatrix4(compose([1.2, 0.03, 0.9]))))
  return parts
}

function grainAuger(): BufferGeometry[] {
  return [
    part(new CylinderGeometry(0.12, 0.12, 4.2, 8), '#c9ced3', compose([0, 1.5, 0], [0, 0, -0.85])),
    part(new BoxGeometry(0.4, 0.3, 0.4), '#9aa3ab', compose([-1.55, 0.25, 0])),
    part(new CylinderGeometry(0.2, 0.08, 0.35, 8), '#9aa3ab', compose([1.6, 2.85, 0], [0, 0, Math.PI])),
    part(new BoxGeometry(0.9, 0.08, 0.08), '#e0b33c', compose([-0.2, 0.5, 0])),
    part(new BoxGeometry(0.06, 1.2, 0.06), '#e0b33c', compose([0.15, 0.95, 0.2], [0, 0, 0.5])),
    part(new BoxGeometry(0.06, 1.2, 0.06), '#e0b33c', compose([0.15, 0.95, -0.2], [0, 0, 0.5])),
    part(new CylinderGeometry(0.2, 0.2, 0.1, 9), '#2f2f2f', compose([-0.2, 0.2, 0.3], [Math.PI / 2, 0, 0])),
    part(new CylinderGeometry(0.2, 0.2, 0.1, 9), '#2f2f2f', compose([-0.2, 0.2, -0.3], [Math.PI / 2, 0, 0])),
  ]
}

function harvestBin(): BufferGeometry[] {
  const parts = [part(new BoxGeometry(0.9, 0.55, 0.9), '#b98a52', compose([0, 0.3, 0])), part(new BoxGeometry(0.8, 0.06, 0.8), '#f2c14e', compose([0, 0.56, 0]))]
  for (const y of [0.15, 0.4]) parts.push(part(new BoxGeometry(0.92, 0.05, 0.92), '#8a6448', compose([0, y, 0])))
  for (let index = 0; index < 4; index += 1) parts.push(part(new CylinderGeometry(0.05, 0.06, 0.2, 5), index % 2 === 0 ? '#e8b33c' : '#f2c14e', compose([-0.2 + (index % 2) * 0.35, 0.62, -0.15 + Math.floor(index / 2) * 0.3], [0, index, Math.PI / 2])))
  return parts
}

export const cornfieldObjects = { grainBin, grainDryer, cornWagon, scarecrow, trailer, plow, machineShed, grainAuger, harvestBin }
