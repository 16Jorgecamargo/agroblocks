import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Color, ConeGeometry, CylinderGeometry, Euler, Float32BufferAttribute, InstancedMesh, Matrix4, Object3D, Quaternion, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { WorldFeature } from '@/render/world/worldTypes'

const SWAY_SPEED = 1.3
const SWAY_ANGLE = 0.05

const LEAVES: [number, number, number][] = [
  [0.35, 0, 1],
  [0.55, 2.3, 0.95],
  [0.78, 4.4, 0.9],
  [1.0, 1.2, 0.8],
  [1.2, 3.5, 0.7],
]

function compose(position: [number, number, number], rotation: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]): Matrix4 {
  return new Matrix4().compose(new Vector3(...position), new Quaternion().setFromEuler(new Euler(...rotation)), new Vector3(...scale))
}

function part(geometry: BufferGeometry, color: string, matrix: Matrix4): BufferGeometry {
  const flat = geometry.toNonIndexed()
  flat.deleteAttribute('uv')
  flat.applyMatrix4(matrix)
  const tint = new Color(color)
  const colors = new Float32Array(flat.attributes.position.count * 3)
  for (let index = 0; index < colors.length; index += 3) colors.set([tint.r, tint.g, tint.b], index)
  flat.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return flat
}

export function cornGeometry(): BufferGeometry {
  const lean = compose([0, 0, 0], [0.04, 0, 0.03])
  const parts: BufferGeometry[] = []
  for (const segment of [0, 1, 2]) {
    parts.push(part(new CylinderGeometry(0.032 - segment * 0.006, 0.042 - segment * 0.006, 0.5, 5), segment === 2 ? '#7aa63c' : '#5f9a32', lean.clone().multiply(compose([0, 0.25 + segment * 0.48, 0]))))
  }
  for (const [height, angle, length] of LEAVES) {
    const base = lean.clone().multiply(compose([0, height, 0], [0, angle, 0]))
    parts.push(part(new ConeGeometry(0.07, 0.62 * length, 3), '#6fae3b', base.multiply(compose([0.24 * length, -0.06, 0], [0, 0, -1.05], [1, 1, 0.22]))))
  }
  const ear = lean.clone().multiply(compose([0.07, 0.72, 0.03], [0, 0, -0.4]))
  parts.push(part(new CylinderGeometry(0.055, 0.06, 0.24, 6), '#f2c14e', ear))
  parts.push(part(new ConeGeometry(0.055, 0.1, 6), '#e8b33c', ear.clone().multiply(compose([0, 0.16, 0]))))
  parts.push(part(new ConeGeometry(0.07, 0.3, 4), '#86b94a', ear.clone().multiply(compose([0.02, -0.02, 0], [0, 0, 0], [1, 1, 0.6]))))
  for (const angle of [0, 1.6, 3.2, 4.7]) {
    parts.push(part(new ConeGeometry(0.02, 0.22, 3), '#d8b866', lean.clone().multiply(compose([Math.cos(angle) * 0.04, 1.5, Math.sin(angle) * 0.04], [Math.sin(angle) * 0.5, 0, Math.cos(angle) * -0.5]))))
  }
  return mergeGeometries(parts)
}

export function CornField({ stalks, ambient }: { stalks: WorldFeature[]; ambient: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => cornGeometry(), [])
  const dummy = useMemo(() => new Object3D(), [])

  const place = (time: number) => {
    if (!mesh.current) return
    stalks.forEach((stalk, index) => {
      dummy.position.set(stalk.x, 0, stalk.z)
      dummy.rotation.set(0, stalk.rotation, ambient ? Math.sin(time + index * 0.7) * SWAY_ANGLE : 0)
      dummy.scale.setScalar(stalk.scale)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => place(0))
  useFrame(({ clock }) => {
    if (ambient) place(clock.elapsedTime * SWAY_SPEED)
  })

  if (stalks.length === 0) return null
  return (
    <instancedMesh key={stalks.length} ref={mesh} args={[geometry, undefined, stalks.length]} castShadow receiveShadow>
      <meshLambertMaterial vertexColors flatShading />
    </instancedMesh>
  )
}
