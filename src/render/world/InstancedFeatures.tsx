import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, Object3D, type InstancedMesh } from 'three'
import { featureGeometry, featureGlass, groupFeatures, PECKING, SPINNING, SWAYING } from '@/render/world/features/featureGeometry'
import type { WorldFeature } from '@/render/world/worldTypes'

const SWAY_SPEED = 1.3
const SWAY_ANGLE = 0.05

function FeatureGroup({ features, ambient, shadows }: { features: WorldFeature[]; ambient: boolean; shadows: boolean }) {
  const solid = useRef<InstancedMesh>(null)
  const glass = useRef<InstancedMesh>(null)
  const { kind, tint } = features[0]
  const geometry = featureGeometry(kind, tint)
  const glassGeometry = featureGlass(kind)
  const dummy = useMemo(() => new Object3D(), [])
  const motion = !ambient ? 'still' : SWAYING.has(kind) ? 'sway' : PECKING.has(kind) ? 'peck' : SPINNING.has(kind) ? 'spin' : 'still'

  const place = (time: number) => {
    features.forEach((feature, index) => {
      dummy.position.set(feature.x, feature.y ?? 0, feature.z)
      const wave = Math.sin(time + index * 0.7)
      dummy.rotation.set(0, feature.rotation + (motion === 'spin' ? time * 2 : 0), motion === 'sway' ? wave * SWAY_ANGLE : motion === 'peck' ? -Math.max(0, Math.sin(time * 2.3 + index * 1.7)) * 0.6 : 0)
      dummy.scale.setScalar(feature.scale)
      dummy.updateMatrix()
      solid.current?.setMatrixAt(index, dummy.matrix)
      glass.current?.setMatrixAt(index, dummy.matrix)
    })
    if (solid.current) solid.current.instanceMatrix.needsUpdate = true
    if (glass.current) glass.current.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => place(0))
  useFrame(({ clock }) => {
    if (motion !== 'still') place(clock.elapsedTime * SWAY_SPEED)
  })

  return (
    <>
      <instancedMesh key={`solid-${features.length}`} ref={solid} args={[geometry, undefined, features.length]} castShadow={shadows} receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.85} metalness={0.02} />
      </instancedMesh>
      {glassGeometry && (
        <instancedMesh key={`glass-${features.length}`} ref={glass} args={[glassGeometry, undefined, features.length]}>
          <meshStandardMaterial vertexColors transparent opacity={0.35} roughness={0.2} side={DoubleSide} depthWrite={false} />
        </instancedMesh>
      )}
    </>
  )
}

export function InstancedFeatures({ features, ambient, shadows = true }: { features: WorldFeature[]; ambient: boolean; shadows?: boolean }) {
  const groups = useMemo(() => [...groupFeatures(features).entries()], [features])
  return (
    <group>
      {groups.map(([key, items]) => (
        <FeatureGroup key={key} features={items} ambient={ambient} shadows={shadows} />
      ))}
    </group>
  )
}
