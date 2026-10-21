import { BoxGeometry, type BufferGeometry, CylinderGeometry } from 'three'
import { compose, part } from '@/render/world/features/parts'

function tractor(): BufferGeometry[] {
  const parts: BufferGeometry[] = [
    part(new BoxGeometry(1.1, 0.42, 0.56), '#3f8f3a', compose([0.15, 0.5, 0])),
    part(new BoxGeometry(0.5, 0.55, 0.6), '#3f8f3a', compose([-0.35, 0.95, 0])),
    part(new BoxGeometry(0.56, 0.06, 0.66), '#f2c14e', compose([-0.35, 1.25, 0])),
    part(new BoxGeometry(0.42, 0.34, 0.02), '#cfe6f0', compose([-0.1, 0.98, 0], [0, Math.PI / 2, 0])),
    part(new CylinderGeometry(0.04, 0.04, 0.4, 5), '#3b3b3b', compose([0.45, 0.85, 0.15])),
  ]
  for (const z of [-0.36, 0.36]) {
    parts.push(part(new CylinderGeometry(0.34, 0.34, 0.16, 10), '#2f2f2f', compose([-0.35, 0.34, z], [Math.PI / 2, 0, 0])))
    parts.push(part(new CylinderGeometry(0.18, 0.18, 0.12, 8), '#2f2f2f', compose([0.55, 0.18, z], [Math.PI / 2, 0, 0])))
    parts.push(part(new CylinderGeometry(0.12, 0.12, 0.17, 8), '#f2c14e', compose([-0.35, 0.34, z], [Math.PI / 2, 0, 0])))
  }
  return parts
}

function wheelbarrow(): BufferGeometry[] {
  return [
    part(new BoxGeometry(0.6, 0.2, 0.42), '#4c78a8', compose([0, 0.36, 0])),
    part(new BoxGeometry(0.5, 0.08, 0.34), '#6b4a2e', compose([0, 0.44, 0])),
    part(new CylinderGeometry(0.13, 0.13, 0.06, 8), '#2f2f2f', compose([0.38, 0.13, 0], [Math.PI / 2, 0, 0])),
    part(new BoxGeometry(0.6, 0.04, 0.04), '#7a5233', compose([-0.45, 0.33, -0.16], [0, 0, 0.25])),
    part(new BoxGeometry(0.6, 0.04, 0.04), '#7a5233', compose([-0.45, 0.33, 0.16], [0, 0, 0.25])),
    part(new BoxGeometry(0.04, 0.24, 0.04), '#7a5233', compose([-0.15, 0.12, -0.14])),
    part(new BoxGeometry(0.04, 0.24, 0.04), '#7a5233', compose([-0.15, 0.12, 0.14])),
  ]
}

function pier(): BufferGeometry[] {
  const parts: BufferGeometry[] = []
  for (let plank = 0; plank < 6; plank += 1) parts.push(part(new BoxGeometry(0.7, 0.05, 0.2), plank % 2 === 0 ? '#a7845a' : '#9a7850', compose([0, 0.14, -plank * 0.22])))
  for (const x of [-0.3, 0.3]) for (const z of [0, -1.1]) parts.push(part(new BoxGeometry(0.08, 0.3, 0.08), '#6b4a2e', compose([x, 0.08, z])))
  return parts
}

export const workObjects = { tractor, wheelbarrow, pier }
