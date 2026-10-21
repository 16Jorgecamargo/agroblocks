import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ConeGeometry, DoubleSide, Euler, Matrix4, Object3D, Quaternion, Sphere, Vector3, type InstancedMesh } from 'three'
import { compose, mergeParts, part } from '@/render/world/features/parts'
import type { Vec2 } from '@/render/world/worldTypes'

const SPEED = 0.6
const FLAP_SPEED = 9
const FLAP_ANGLE = 0.65
const GLIDE = 0.35

function bodyGeometry() {
  return mergeParts([part(new ConeGeometry(0.05, 0.3, 4), '#3b3b3b', compose([0, 0, 0], [0, 0, -Math.PI / 2])), part(new ConeGeometry(0.04, 0.1, 3), '#4a4a4a', compose([-0.17, 0.01, 0], [0, 0, Math.PI / 2], [1, 1, 2]))])
}

function wingGeometry() {
  return mergeParts([part(new ConeGeometry(0.12, 0.35, 3), '#4a4a4a', compose([0, 0, 0.175], [Math.PI / 2, 0, 0], [1, 1, 0.2]))])
}

function orbit(index: number) {
  return { radius: 1.5 + (index % 3) * 0.7, height: 4 + (index % 2) * 0.8, phase: index * 1.9 }
}

export function birdPosition(point: Vec2, index: number, time: number): Vector3 {
  const { radius, height, phase } = orbit(index)
  const angle = time * SPEED + phase
  return new Vector3(point.x + Math.cos(angle) * radius, height + Math.sin(time * 2 + phase) * 0.1, point.z + Math.sin(angle) * radius)
}

export function wingAngle(index: number, time: number): number {
  const phase = orbit(index).phase
  const beating = Math.sin(time * 0.7 + phase) > -GLIDE
  return beating ? Math.sin(time * FLAP_SPEED + phase * 3) * FLAP_ANGLE : 0.12
}

export function flockBounds(points: Vec2[]): Sphere {
  const center = new Vector3()
  for (const point of points) center.add(new Vector3(point.x, 4.4, point.z))
  center.divideScalar(Math.max(1, points.length))
  const reach = Math.max(0, ...points.map((point) => Math.hypot(point.x - center.x, point.z - center.z)))
  return new Sphere(center, reach + 3.6)
}

export function Birds({ points, active }: { points: Vec2[]; active: boolean }) {
  const body = useRef<InstancedMesh>(null)
  const wings = useRef<InstancedMesh>(null)
  const geometries = useMemo(() => ({ body: bodyGeometry(), wing: wingGeometry() }), [])
  const dummy = useMemo(() => new Object3D(), [])

  const place = (time: number) => {
    points.forEach((point, index) => {
      dummy.position.copy(birdPosition(point, index, time))
      dummy.rotation.set(0, -(time * SPEED + orbit(index).phase), 0)
      dummy.updateMatrix()
      body.current?.setMatrixAt(index, dummy.matrix)
      const flap = wingAngle(index, time)
      for (const side of [1, -1]) {
        const wing = new Matrix4().compose(new Vector3(0, 0.02, 0), new Quaternion().setFromEuler(new Euler(-flap * side, 0, 0)), new Vector3(1, 1, side))
        wings.current?.setMatrixAt(index * 2 + (side > 0 ? 0 : 1), dummy.matrix.clone().multiply(wing))
      }
    })
    const bounds = flockBounds(points)
    for (const mesh of [body.current, wings.current]) {
      if (!mesh) continue
      mesh.instanceMatrix.needsUpdate = true
      mesh.boundingSphere = bounds
    }
  }

  useLayoutEffect(() => place(0))
  useFrame(({ clock }) => {
    if (active) place(clock.elapsedTime)
  })

  if (points.length === 0) return null
  return (
    <>
      <instancedMesh key={`body-${points.length}`} ref={body} args={[geometries.body, undefined, points.length]}>
        <meshStandardMaterial vertexColors flatShading roughness={0.9} />
      </instancedMesh>
      <instancedMesh key={`wings-${points.length}`} ref={wings} args={[geometries.wing, undefined, points.length * 2]}>
        <meshStandardMaterial vertexColors flatShading roughness={0.9} side={DoubleSide} />
      </instancedMesh>
    </>
  )
}
