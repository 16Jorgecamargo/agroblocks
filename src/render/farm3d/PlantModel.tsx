import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { PALETTE } from '@/render/palette'
import { Flat } from '@/render/farm3d/materials'

interface PlantModelProps {
  stage: 'seeded' | 'growing' | 'mature' | 'harvested'
  reducedMotion: boolean
}

function useGrowIn(reducedMotion: boolean) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    const group = ref.current
    if (!group) return
    const next = reducedMotion ? 1 : Math.min(1, group.scale.x + delta * 3)
    group.scale.setScalar(next)
  })
  return ref
}

export function PlantModel({ stage, reducedMotion }: PlantModelProps) {
  const ref = useGrowIn(reducedMotion)
  return (
    <group ref={ref} scale={reducedMotion ? 1 : 0.2}>
      {stage === 'seeded' && (
        <>
          <mesh position={[0, 0.03, 0]} castShadow>
            <sphereGeometry args={[0.12, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Flat color={PALETTE.soilTilled} />
          </mesh>
          <mesh position={[0, 0.1, 0]} castShadow>
            <coneGeometry args={[0.05, 0.12, 4]} />
            <Flat color={PALETTE.sprout} />
          </mesh>
        </>
      )}
      {stage === 'growing' && (
        <>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.02, 0.025, 0.24, 5]} />
            <Flat color={PALETTE.leafDark} />
          </mesh>
          {[0, 1, 2].map((index) => (
            <mesh
              key={index}
              position={[Math.cos((index * Math.PI * 2) / 3) * 0.09, 0.18 + index * 0.03, Math.sin((index * Math.PI * 2) / 3) * 0.09]}
              rotation={[0.6, (index * Math.PI * 2) / 3, 0]}
              castShadow
            >
              <coneGeometry args={[0.07, 0.18, 4]} />
              <Flat color={PALETTE.leaf} />
            </mesh>
          ))}
        </>
      )}
      {stage === 'mature' && (
        <>
          <mesh position={[0, 0.24, 0]} castShadow>
            <icosahedronGeometry args={[0.24, 0]} />
            <Flat color={PALETTE.leaf} />
          </mesh>
          <mesh position={[0.08, 0.36, -0.05]} castShadow>
            <icosahedronGeometry args={[0.15, 0]} />
            <Flat color={PALETTE.leafDark} />
          </mesh>
          {[
            [0.17, 0.2, 0.1],
            [-0.15, 0.24, 0.12],
            [0.02, 0.18, -0.2],
          ].map(([x, y, z], index) => (
            <mesh key={index} position={[x, y, z]} castShadow>
              <icosahedronGeometry args={[0.075, 1]} />
              <Flat color={index === 1 ? PALETTE.fruitAlt : PALETTE.fruit} />
            </mesh>
          ))}
        </>
      )}
      {stage === 'harvested' &&
        [-0.18, 0, 0.18].map((x, index) => (
          <mesh key={index} position={[x, 0.05, (index - 1) * 0.12]} rotation={[0, index, 0.3]}>
            <cylinderGeometry args={[0.015, 0.02, 0.12, 4]} />
            <Flat color={PALETTE.straw} />
          </mesh>
        ))}
    </group>
  )
}
