import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry, SphereGeometry } from 'three'
import { compose, part } from '@/render/world/features/parts'

const FRAME = '#eef3f1'
const GLASS = '#d6f0ea'

function greenhouseBay(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(3, 0.06, 2), '#cfc6b0', compose([0, 0.03, 0]))]
  for (const x of [-1.47, 1.47]) for (const z of [-0.97, 0, 0.97]) parts.push(part(new BoxGeometry(0.06, 1.5, 0.06), FRAME, compose([x, 0.75, z])))
  parts.push(part(new BoxGeometry(3, 0.06, 0.06), FRAME, compose([0, 1.5, -0.97])), part(new BoxGeometry(3, 0.06, 0.06), FRAME, compose([0, 1.5, 0.97])))
  parts.push(part(new BoxGeometry(3, 0.06, 0.06), FRAME, compose([0, 2.05, 0])))
  for (const z of [-0.55, 0, 0.55]) parts.push(part(new BoxGeometry(2.6, 0.18, 0.36), '#6b4a2e', compose([0, 0.12, z])), part(new BoxGeometry(2.5, 0.14, 0.3), '#6fae4a', compose([0, 0.28, z])))
  return parts
}

function greenhouseBayGlass(): BufferGeometry[] {
  return [
    part(new BoxGeometry(3, 1.44, 0.02), GLASS, compose([0, 0.75, -0.98])),
    part(new BoxGeometry(3, 1.44, 0.02), GLASS, compose([0, 0.75, 0.98])),
    part(new BoxGeometry(0.02, 1.44, 1.94), GLASS, compose([-1.48, 0.75, 0])),
    part(new BoxGeometry(0.02, 1.44, 1.94), GLASS, compose([1.48, 0.75, 0])),
    part(new BoxGeometry(3, 0.02, 1.12), GLASS, compose([0, 1.78, -0.49], [-0.5, 0, 0])),
    part(new BoxGeometry(3, 0.02, 1.12), GLASS, compose([0, 1.78, 0.49], [0.5, 0, 0])),
  ]
}

function supportShed(): BufferGeometry[] {
  return [
    part(new BoxGeometry(2, 1.6, 1.6), '#f1f1ea', compose([0, 0.8, 0])),
    part(new BoxGeometry(2.2, 0.1, 1.9), '#3f8f5a', compose([0, 1.78, 0], [0.12, 0, 0])),
    part(new BoxGeometry(0.9, 1.1, 0.04), '#b9c2c8', compose([-0.3, 0.55, 0.81])),
    part(new BoxGeometry(0.4, 0.3, 0.04), '#7fb7c9', compose([0.6, 1.0, 0.81])),
  ]
}

function waterTank(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  for (const x of [-0.4, 0.4]) for (const z of [-0.4, 0.4]) parts.push(part(new BoxGeometry(0.08, 2, 0.08), '#8d969b', compose([x, 1, z])))
  parts.push(part(new BoxGeometry(1.0, 0.08, 1.0), '#8d969b', compose([0, 2.02, 0])))
  parts.push(part(new CylinderGeometry(0.55, 0.55, 1.0, 10), '#7fb7c9', compose([0, 2.56, 0])))
  parts.push(part(new ConeGeometry(0.58, 0.3, 10), '#5f97a9', compose([0, 3.21, 0])))
  return parts
}

function sprinkler(): BufferGeometry[] {
  return [
    part(new CylinderGeometry(0.03, 0.03, 0.5, 5), '#8d969b', compose([0, 0.25, 0])),
    part(new BoxGeometry(0.6, 0.03, 0.03), '#5f6a70', compose([0, 0.5, 0])),
    part(new ConeGeometry(0.04, 0.08, 5), '#4c9be8', compose([0.3, 0.47, 0], [Math.PI, 0, 0])),
    part(new ConeGeometry(0.04, 0.08, 5), '#4c9be8', compose([-0.3, 0.47, 0], [Math.PI, 0, 0])),
  ]
}

function tallGreenhouse(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(4.2, 0.08, 2.6), '#cfc6b0', compose([0, 0.04, 0])), part(new BoxGeometry(4.2, 0.3, 2.6), '#b7b0a0', compose([0, 0.15, 0], [0, 0, 0], [1, 1, 1]))]
  for (const x of [-2.07, -1.03, 0, 1.03, 2.07]) {
    for (const z of [-1.27, 1.27]) parts.push(part(new BoxGeometry(0.07, 2.0, 0.07), FRAME, compose([x, 1.0, z])))
    parts.push(part(new BoxGeometry(0.06, 0.06, 1.5), FRAME, compose([x, 2.4, -0.62], [-0.55, 0, 0])))
    parts.push(part(new BoxGeometry(0.06, 0.06, 1.5), FRAME, compose([x, 2.4, 0.62], [0.55, 0, 0])))
  }
  parts.push(part(new BoxGeometry(4.2, 0.07, 0.07), FRAME, compose([0, 2.82, 0])))
  for (const z of [-1.27, 1.27]) parts.push(part(new BoxGeometry(4.2, 0.07, 0.07), FRAME, compose([0, 2.0, z])))
  parts.push(part(new BoxGeometry(0.06, 1.3, 0.7), '#b9c2c8', compose([2.1, 0.8, 0])))
  for (const z of [-0.75, 0, 0.75]) {
    parts.push(part(new BoxGeometry(3.6, 0.2, 0.42), '#6b4a2e', compose([0, 0.38, z])))
    for (let index = 0; index < 6; index += 1) {
      const x = -1.5 + index * 0.6
      parts.push(part(new CylinderGeometry(0.1, 0.13, 1.1, 5), index % 2 === 0 ? '#3f8f3a' : '#4f9a3a', compose([x, 1.0, z])))
      parts.push(part(new SphereGeometry(0.06, 5, 4), index % 3 === 0 ? '#f2a03c' : '#e0473c', compose([x + 0.1, 0.9 + (index % 2) * 0.3, z + 0.1])))
    }
    parts.push(part(new BoxGeometry(3.6, 0.02, 0.02), '#2f2f2f', compose([0, 1.65, z])))
  }
  return parts
}

function tallGreenhouseGlass(): BufferGeometry[] {
  return [
    part(new BoxGeometry(4.2, 1.7, 0.02), GLASS, compose([0, 1.15, -1.28])),
    part(new BoxGeometry(4.2, 1.7, 0.02), GLASS, compose([0, 1.15, 1.28])),
    part(new BoxGeometry(0.02, 1.7, 2.56), GLASS, compose([-2.09, 1.15, 0])),
    part(new BoxGeometry(4.2, 0.02, 1.55), GLASS, compose([0, 2.41, -0.64], [-0.55, 0, 0])),
    part(new BoxGeometry(4.2, 0.02, 1.55), GLASS, compose([0, 2.41, 0.64], [0.55, 0, 0])),
  ]
}

function nurseryHouse(): BufferGeometry[] {
  const parts: BufferGeometry[] = [part(new BoxGeometry(2.0, 0.06, 1.5), '#cfc6b0', compose([0, 0.03, 0]))]
  for (const x of [-0.97, 0.97]) for (const z of [-0.72, 0.72]) parts.push(part(new BoxGeometry(0.05, 1.0, 0.05), FRAME, compose([x, 0.5, z])))
  for (const z of [-0.72, 0.72]) parts.push(part(new BoxGeometry(2.0, 0.05, 0.05), FRAME, compose([0, 1.0, z])))
  parts.push(part(new BoxGeometry(2.0, 0.05, 0.05), FRAME, compose([0, 1.5, 0])))
  for (const z of [-0.4, 0.4]) {
    parts.push(part(new BoxGeometry(1.7, 0.05, 0.5), '#b98a52', compose([0, 0.55, z])))
    for (const x of [-0.6, 0, 0.6]) parts.push(part(new BoxGeometry(0.45, 0.05, 0.4), '#3b3b3b', compose([x, 0.6, z])))
    for (let index = 0; index < 9; index += 1) parts.push(part(new ConeGeometry(0.035, 0.1, 4), '#8fd45a', compose([-0.75 + index * 0.19, 0.68, z + (index % 2) * 0.1 - 0.05])))
  }
  return parts
}

function nurseryHouseGlass(): BufferGeometry[] {
  return [
    part(new BoxGeometry(2.0, 0.98, 0.02), GLASS, compose([0, 0.5, -0.73])),
    part(new BoxGeometry(2.0, 0.98, 0.02), GLASS, compose([0, 0.5, 0.73])),
    part(new BoxGeometry(0.02, 0.98, 1.44), GLASS, compose([0.98, 0.5, 0])),
    part(new BoxGeometry(2.0, 0.02, 0.9), GLASS, compose([0, 1.25, -0.37], [-0.6, 0, 0])),
    part(new BoxGeometry(2.0, 0.02, 0.9), GLASS, compose([0, 1.25, 0.37], [0.6, 0, 0])),
  ]
}

function pumpHouse(): BufferGeometry[] {
  return [
    part(new BoxGeometry(1.2, 1.0, 1.0), '#d9d2c3', compose([0, 0.5, 0])),
    part(new BoxGeometry(1.35, 0.08, 1.15), '#3f8f5a', compose([0, 1.1, 0], [0.1, 0, 0])),
    part(new BoxGeometry(0.4, 0.7, 0.04), '#7d868e', compose([-0.2, 0.35, 0.51])),
    part(new CylinderGeometry(0.08, 0.08, 1.0, 6), '#4c78a8', compose([0.75, 0.2, 0.2], [0, 0, Math.PI / 2])),
    part(new CylinderGeometry(0.08, 0.08, 0.5, 6), '#4c78a8', compose([1.2, 0.2, 0.2], [Math.PI / 2, 0, 0])),
    part(new CylinderGeometry(0.15, 0.15, 0.25, 8), '#4c78a8', compose([0.4, 0.2, 0.2], [0, 0, Math.PI / 2])),
  ]
}

function controlStation(): BufferGeometry[] {
  return [
    part(new BoxGeometry(0.1, 1.1, 0.1), '#8d969b', compose([-0.25, 0.55, 0])),
    part(new BoxGeometry(0.1, 1.1, 0.1), '#8d969b', compose([0.25, 0.55, 0])),
    part(new BoxGeometry(0.7, 0.55, 0.25), '#e9ece6', compose([0, 0.95, 0.05])),
    part(new BoxGeometry(0.25, 0.15, 0.02), '#2f6690', compose([-0.12, 1.05, 0.18])),
    part(new BoxGeometry(0.06, 0.06, 0.02), '#3fa34d', compose([0.15, 1.05, 0.18])),
    part(new BoxGeometry(0.06, 0.06, 0.02), '#e0473c', compose([0.15, 0.9, 0.18])),
    part(new BoxGeometry(0.8, 0.05, 0.4), '#3f8f5a', compose([0, 1.26, 0.05])),
    part(new CylinderGeometry(0.04, 0.04, 0.9, 5), '#4c78a8', compose([0, 0.12, 0.45], [Math.PI / 2, 0, 0])),
  ]
}

export const greenhouseObjects = { greenhouseBay, supportShed, waterTank, sprinkler, tallGreenhouse, nurseryHouse, pumpHouse, controlStation }

export const greenhouseGlass = { greenhouseBay: greenhouseBayGlass, tallGreenhouse: tallGreenhouseGlass, nurseryHouse: nurseryHouseGlass }
