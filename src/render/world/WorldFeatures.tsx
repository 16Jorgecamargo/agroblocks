import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { Flat } from '@/render/farm3d/materials'
import type { WorldFeature } from '@/render/world/worldTypes'

const SWAY_SPEED = 1.3
const SWAY_ANGLE = 0.05

function CornStalk() {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 1.5, 5]} />
        <Flat color="#5f9a32" />
      </mesh>
      {[0.45, 0.8, 1.15].map((height, index) => (
        <mesh key={height} position={[index % 2 === 0 ? 0.16 : -0.16, height, 0]} rotation={[0, 0, index % 2 === 0 ? -0.9 : 0.9]} castShadow>
          <boxGeometry args={[0.4, 0.03, 0.12]} />
          <Flat color="#74b43f" />
        </mesh>
      ))}
      <mesh position={[0.07, 1.0, 0.04]} rotation={[0, 0, -0.35]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.3, 6]} />
        <Flat color="#f2c14e" />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <coneGeometry args={[0.08, 0.2, 5]} />
        <Flat color="#c9a227" />
      </mesh>
    </group>
  )
}

function FruitTree({ tint }: { tint: string }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 1, 6]} />
        <Flat color="#7a5233" />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <icosahedronGeometry args={[0.75, 0]} />
        <Flat color="#3f8f3a" />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const angle = (index / 6) * Math.PI * 2
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.62, 1.2 + (index % 2) * 0.3, Math.sin(angle) * 0.62]} castShadow>
            <sphereGeometry args={[0.1, 6, 5]} />
            <Flat color={tint} />
          </mesh>
        )
      })}
    </group>
  )
}

function Greenhouse() {
  return (
    <group>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[3.2, 0.08, 2.2]} />
        <Flat color="#b9a68a" />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[3, 1.4, 2]} />
        <Flat color="#cfeee8" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 1.75, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]}>
        <cylinderGeometry args={[0.6, 0.6, 3, 3, 1]} />
        <Flat color="#cfeee8" transparent opacity={0.35} />
      </mesh>
      {[-1.5, 0, 1.5].map((x) => (
        <mesh key={x} position={[x, 0.95, 1.01]}>
          <boxGeometry args={[0.06, 1.9, 0.06]} />
          <Flat color="#e8f2f0" />
        </mesh>
      ))}
      {[-0.9, 0, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.3, 0]} castShadow>
          <boxGeometry args={[0.7, 0.4, 1.4]} />
          <Flat color="#6fae4a" />
        </mesh>
      ))}
    </group>
  )
}

function VegetableBed() {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.24, 0.8]} />
        <Flat color="#7a5233" />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh key={index} position={[-0.45 + (index % 3) * 0.45, 0.32, index < 3 ? -0.18 : 0.18]} castShadow>
          <icosahedronGeometry args={[0.13, 0]} />
          <Flat color={index % 2 === 0 ? '#4f9a3a' : '#7fbf4d'} />
        </mesh>
      ))}
    </group>
  )
}

function HayBale() {
  return (
    <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.45, 0.45, 0.8, 10]} />
      <Flat color="#e2c46a" />
    </mesh>
  )
}

function Trough() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.2, 0.44, 0.5]} />
        <Flat color="#8a6a4a" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.05, 0.04, 0.36]} />
        <Flat color="#4c9be8" />
      </mesh>
    </group>
  )
}

function FeatureMesh({ feature }: { feature: WorldFeature }) {
  switch (feature.kind) {
    case 'cornStalk':
      return <CornStalk />
    case 'fruitTree':
      return <FruitTree tint={feature.tint ?? '#e0473c'} />
    case 'greenhouse':
      return <Greenhouse />
    case 'vegetableBed':
      return <VegetableBed />
    case 'hayBale':
      return <HayBale />
    case 'trough':
      return <Trough />
  }
}

export function WorldFeatures({ features, ambient }: { features: WorldFeature[]; ambient: boolean }) {
  const corn = useRef<Group>(null)

  useFrame(({ clock }) => {
    if (!ambient || !corn.current) return
    const time = clock.elapsedTime * SWAY_SPEED
    corn.current.children.forEach((child, index) => {
      child.rotation.z = Math.sin(time + index * 0.7) * SWAY_ANGLE
    })
  })

  const stalks = features.filter((feature) => feature.kind === 'cornStalk')
  const others = features.filter((feature) => feature.kind !== 'cornStalk')
  return (
    <group>
      <group ref={corn}>
        {stalks.map((feature, index) => (
          <group key={index} position={[feature.x, 0, feature.z]} rotation={[0, feature.rotation, 0]} scale={feature.scale}>
            <CornStalk />
          </group>
        ))}
      </group>
      {others.map((feature, index) => (
        <group key={index} position={[feature.x, 0, feature.z]} rotation={[0, feature.rotation, 0]} scale={feature.scale}>
          <FeatureMesh feature={feature} />
        </group>
      ))}
    </group>
  )
}
