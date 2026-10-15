import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from 'three'
import type { Vec2 } from '@/render/world/worldTypes'

const SAMPLES_PER_UNIT = 3
const MIN_SAMPLES = 8

export function ribbonGeometry(points: Vec2[], width: number): BufferGeometry {
  const geometry = new BufferGeometry()
  if (points.length < 2) return geometry
  const curve = new CatmullRomCurve3(points.map((point) => new Vector3(point.x, 0, point.z)), false, 'centripetal')
  const samples = Math.max(MIN_SAMPLES, Math.ceil(curve.getLength() * SAMPLES_PER_UNIT))
  const positions: number[] = []
  const indices: number[] = []
  const half = width / 2
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    const normalX = -tangent.z
    const normalZ = tangent.x
    const length = Math.hypot(normalX, normalZ) || 1
    positions.push(point.x + (normalX / length) * half, 0, point.z + (normalZ / length) * half)
    positions.push(point.x - (normalX / length) * half, 0, point.z - (normalZ / length) * half)
    if (index > 0) {
      const base = (index - 1) * 2
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2)
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}
