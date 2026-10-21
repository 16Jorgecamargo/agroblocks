import { BufferGeometry, Color, Euler, ExtrudeGeometry, Float32BufferAttribute, Matrix4, Quaternion, Shape, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Triple = [number, number, number]

export function compose(position: Triple, rotation: Triple = [0, 0, 0], scale: Triple = [1, 1, 1]): Matrix4 {
  return new Matrix4().compose(new Vector3(...position), new Quaternion().setFromEuler(new Euler(...rotation)), new Vector3(...scale))
}

export function part(geometry: BufferGeometry, color: string, matrix: Matrix4): BufferGeometry {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone()
  flat.deleteAttribute('uv')
  flat.applyMatrix4(matrix)
  const tint = new Color(color)
  const colors = new Float32Array(flat.attributes.position.count * 3)
  for (let index = 0; index < colors.length; index += 3) colors.set([tint.r, tint.g, tint.b], index)
  flat.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return flat
}

export function gable(width: number, height: number, depth: number): BufferGeometry {
  const shape = new Shape()
  shape.moveTo(-depth / 2, 0)
  shape.lineTo(depth / 2, 0)
  shape.lineTo(0, height)
  shape.closePath()
  const prism = new ExtrudeGeometry(shape, { depth: width, bevelEnabled: false })
  prism.translate(0, 0, -width / 2)
  prism.rotateY(Math.PI / 2)
  return prism
}

export function mergeParts(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts)
  if (!merged) throw new Error('feature parts could not be merged')
  return merged
}
