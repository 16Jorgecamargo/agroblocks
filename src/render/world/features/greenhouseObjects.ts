import { BoxGeometry, type BufferGeometry, ConeGeometry, CylinderGeometry } from 'three'
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
    part(new BoxGeometry(2.2, 0.1, 1.9), '#3f8f5a', compose([0, 1.72, 0], [0.12, 0, 0])),
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

export const greenhouseObjects = { greenhouseBay, supportShed, waterTank, sprinkler }

export const greenhouseGlass = { greenhouseBay: greenhouseBayGlass }
