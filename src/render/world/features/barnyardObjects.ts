import { BoxGeometry, type BufferGeometry, CylinderGeometry } from 'three'
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

export const barnyardObjects = { feedShed, baleStack }
