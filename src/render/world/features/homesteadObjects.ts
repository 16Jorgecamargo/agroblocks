import { BoxGeometry, type BufferGeometry } from 'three'
import { compose, gable, part } from '@/render/world/features/parts'

function farmhouse(): BufferGeometry[] {
  const parts: BufferGeometry[] = [
    part(new BoxGeometry(2.8, 0.2, 2.2), '#a99a80', compose([0, 0.1, 0])),
    part(new BoxGeometry(2.4, 2.2, 1.8), '#f1e6d2', compose([0, 1.3, -0.1])),
    part(new BoxGeometry(2.7, 0.1, 1.25), '#a33b2f', compose([0, 2.86, -0.55], [-0.75, 0, 0])),
    part(new BoxGeometry(2.7, 0.1, 1.25), '#a33b2f', compose([0, 2.86, 0.35], [0.75, 0, 0])),
    part(gable(2.4, 0.84, 1.8), '#f1e6d2', compose([0, 2.4, -0.1])),
    part(new BoxGeometry(0.3, 0.9, 0.3), '#8a5a3c', compose([0.7, 3.1, -0.4])),
    part(new BoxGeometry(2.4, 0.08, 0.7), '#8a5a3c', compose([0, 1.1, 1.15])),
    part(new BoxGeometry(0.5, 0.95, 0.04), '#8a5a3c', compose([0, 0.68, 0.81])),
  ]
  for (const x of [-1.1, 0, 1.1]) parts.push(part(new BoxGeometry(0.08, 1, 0.08), '#efe9dd', compose([x, 0.6, 1.45])))
  for (const [x, y] of [
    [-0.75, 0.75],
    [0.75, 0.75],
    [-0.75, 1.8],
    [0.75, 1.8],
  ]) parts.push(part(new BoxGeometry(0.4, 0.4, 0.04), '#7fb7c9', compose([x, y, 0.81])))
  return parts
}

export const homesteadObjects = { farmhouse }
