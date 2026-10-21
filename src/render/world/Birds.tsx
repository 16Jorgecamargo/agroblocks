import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ConeGeometry, Object3D, type InstancedMesh } from 'three'
import { compose, mergeParts, part } from '@/render/world/features/parts'
import type { Vec2 } from '@/render/world/worldTypes'

const SPEED = 0.6

function birdGeometry() {
  return mergeParts([
    part(new ConeGeometry(0.05, 0.3, 4), '#3b3b3b', compose([0, 0, 0], [0, 0, -Math.PI / 2])),
    part(new ConeGeometry(0.12, 0.35, 3), '#4a4a4a', compose([0, 0.02, 0.17], [Math.PI / 2, 0, 0], [1, 1, 0.2])),
    part(new ConeGeometry(0.12, 0.35, 3), '#4a4a4a', compose([0, 0.02, -0.17], [-Math.PI / 2, 0, 0], [1, 1, 0.2])),
  ])
}

function orbit(index: number) {
  return { radius: 1.5 + (index % 3) * 0.7, height: 4 + (index % 2) * 0.8, phase: index * 1.9 }
}

export function Birds({ points, active }: { points: Vec2[]; active: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  const geometry = useMemo(birdGeometry, [])
  const dummy = useMemo(() => new Object3D(), [])

  const place = (time: number) => {
    points.forEach((point, index) => {
      const { radius, height, phase } = orbit(index)
      const angle = time * SPEED + phase
      dummy.position.set(point.x + Math.cos(angle) * radius, height + Math.sin(time * 2 + phase) * 0.1, point.z + Math.sin(angle) * radius)
      dummy.rotation.set(0, -angle, 0)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(index, dummy.matrix)
    })
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => place(0))
  useFrame(({ clock }) => {
    if (active) place(clock.elapsedTime)
  })

  if (points.length === 0) return null
  return (
    <instancedMesh key={points.length} ref={mesh} args={[geometry, undefined, points.length]}>
      <meshStandardMaterial vertexColors flatShading roughness={0.9} />
    </instancedMesh>
  )
}
