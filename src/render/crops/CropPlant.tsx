import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CylinderGeometry, IcosahedronGeometry, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, SphereGeometry, type Group, type Mesh } from 'three'
import { cropShape, type CropStage } from '@/render/crops/cropShape'
import { PALETTE } from '@/render/palette'

function flat(color: string, emissive = '#000000', emissiveIntensity = 0): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0.02, emissive, emissiveIntensity })
}

const MATERIALS = {
  leaf: flat(PALETTE.leaf),
  leafDark: flat(PALETTE.leafDark),
  stem: flat(PALETTE.leafDark),
  red: flat(PALETTE.fruit, PALETTE.fruit, 0.18),
  green: flat(PALETTE.fruitUnripe),
  soil: flat(PALETTE.soilTilled),
  straw: flat(PALETTE.straw),
  glow: new MeshBasicMaterial({ color: PALETTE.readyGlow, transparent: true, opacity: 0.6, depthWrite: false }),
  spark: new MeshBasicMaterial({ color: PALETTE.readyGlow }),
}

const GEOMETRIES = {
  leaf: new IcosahedronGeometry(1, 0),
  fruit: new IcosahedronGeometry(1, 1),
  stem: new CylinderGeometry(0.02, 0.03, 1, 5),
  mound: new SphereGeometry(0.14, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2),
  ring: new RingGeometry(0.36, 0.44, 24),
  spark: new IcosahedronGeometry(0.06, 0),
  stalk: new CylinderGeometry(0.015, 0.02, 0.12, 4),
}

interface CropPlantProps {
  stage: CropStage
  seed: number
  reducedMotion: boolean
}

export function CropPlant({ stage, seed, reducedMotion }: CropPlantProps) {
  const shape = cropShape(stage)
  const sway = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const spark = useRef<Group>(null)
  const animated = shape.glow && !reducedMotion

  useFrame(({ clock }) => {
    if (!animated) return
    const time = clock.elapsedTime + seed
    if (sway.current) sway.current.rotation.z = Math.sin(time * 1.6) * 0.04
    if (ring.current) {
      const pulse = 1 + Math.sin(time * 3) * 0.08
      ring.current.scale.set(pulse, pulse, 1)
    }
    if (spark.current) {
      spark.current.position.y = shape.height + 0.18 + Math.sin(time * 2.4) * 0.05
      spark.current.rotation.y = time * 1.5
    }
  })

  return (
    <group rotation={[0, seed % (Math.PI * 2), 0]}>
      {shape.mound && <mesh geometry={GEOMETRIES.mound} material={MATERIALS.soil} castShadow />}
      {shape.glow && <mesh ref={ring} geometry={GEOMETRIES.ring} material={MATERIALS.glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} />}
      <group ref={sway}>
        <mesh geometry={GEOMETRIES.stem} material={MATERIALS.stem} position={[0, shape.stemHeight / 2, 0]} scale={[1, shape.stemHeight, 1]} />
        {shape.leaves.map((leaf, index) => (
          <mesh
            key={`leaf-${index}`}
            geometry={GEOMETRIES.leaf}
            material={index % 2 === 0 ? MATERIALS.leaf : MATERIALS.leafDark}
            position={[leaf.x, leaf.y, leaf.z]}
            scale={[leaf.radius, leaf.radius * leaf.squash, leaf.radius]}
            castShadow
          />
        ))}
        {shape.fruits.map((fruit, index) => (
          <mesh
            key={`fruit-${index}`}
            geometry={GEOMETRIES.fruit}
            material={fruit.color === 'red' ? MATERIALS.red : MATERIALS.green}
            position={[fruit.x, fruit.y, fruit.z]}
            scale={fruit.radius}
            castShadow
          />
        ))}
      </group>
      {animated && (
        <group ref={spark} position={[0, shape.height + 0.18, 0]}>
          <mesh geometry={GEOMETRIES.spark} material={MATERIALS.spark} />
        </group>
      )}
    </group>
  )
}

export function HarvestedStubble() {
  return (
    <group>
      {[-0.18, 0, 0.18].map((x, index) => (
        <mesh key={x} geometry={GEOMETRIES.stalk} material={MATERIALS.straw} position={[x, 0.05, (index - 1) * 0.12]} rotation={[0, index, 0.3]} />
      ))}
    </group>
  )
}
