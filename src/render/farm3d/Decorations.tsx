import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { PALETTE } from '@/render/palette'
import { Flat } from '@/render/farm3d/materials'
import type { Decoration } from '@/render/sceneLayout'

const CANOPY = [PALETTE.leaf, PALETTE.grassDark, PALETTE.leafDark]

export function Tree({ variant = 0 }: { variant?: number }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 6]} />
        <Flat color={PALETTE.trunk} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <icosahedronGeometry args={[0.55, 0]} />
        <Flat color={CANOPY[variant % CANOPY.length]} />
      </mesh>
      <mesh position={[0.2, 1.35, 0.1]} castShadow>
        <icosahedronGeometry args={[0.32, 0]} />
        <Flat color={CANOPY[(variant + 1) % CANOPY.length]} />
      </mesh>
    </group>
  )
}

function Pine() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.5, 5]} />
        <Flat color={PALETTE.trunk} />
      </mesh>
      {[0.7, 1.05, 1.35].map((y, index) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <coneGeometry args={[0.5 - index * 0.12, 0.6, 6]} />
          <Flat color={PALETTE.leafDark} />
        </mesh>
      ))}
    </group>
  )
}

function Rock() {
  return (
    <mesh position={[0, 0.15, 0]} scale={[1, 0.6, 0.9]} castShadow>
      <dodecahedronGeometry args={[0.35, 0]} />
      <Flat color={PALETTE.rock} />
    </mesh>
  )
}

function Bush() {
  return (
    <mesh position={[0, 0.25, 0]} castShadow>
      <icosahedronGeometry args={[0.35, 0]} />
      <Flat color={PALETTE.bush} />
    </mesh>
  )
}

function Fence() {
  return (
    <group>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.44, 0.08]} />
          <Flat color={PALETTE.fence} />
        </mesh>
      ))}
      {[0.16, 0.32].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[1, 0.06, 0.04]} />
          <Flat color={PALETTE.fence} />
        </mesh>
      ))}
    </group>
  )
}

export function Barn() {
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.6, 1.8]} />
        <Flat color={PALETTE.barnRed} />
      </mesh>
      <mesh position={[0, 1.9, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1.3, 1]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 1.95, 3]} />
        <Flat color={PALETTE.roof} />
      </mesh>
      <mesh position={[1.11, 0.6, 0]}>
        <boxGeometry args={[0.02, 1.0, 0.8]} />
        <Flat color={PALETTE.barnTrim} />
      </mesh>
      <mesh position={[1.12, 0.6, 0]}>
        <boxGeometry args={[0.02, 0.86, 0.66]} />
        <Flat color={PALETTE.barnRed} />
      </mesh>
    </group>
  )
}

export function Windmill({ animate }: { animate: boolean }) {
  const blades = useRef<Group>(null)
  useFrame((_, delta) => {
    if (animate && blades.current) blades.current.rotation.z += delta * 0.8
  })
  return (
    <group>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.45, 2.8, 4]} />
        <Flat color={PALETTE.fence} />
      </mesh>
      <group ref={blades} position={[0, 2.8, 0.35]}>
        {[0, 1, 2, 3].map((index) => (
          <mesh key={index} rotation={[0, 0, (index * Math.PI) / 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.16, 1.5, 0.03]} />
            <Flat color={PALETTE.barnTrim} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Silo() {
  return (
    <group>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 2.2, 10]} />
        <Flat color={PALETTE.metal} />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[0.55, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Flat color={PALETTE.roof} />
      </mesh>
    </group>
  )
}

export function Decorations({ items, animate }: { items: Decoration[]; animate: boolean }) {
  return (
    <>
      {items.map((item, index) => (
        <group key={index} position={[item.x, 0, item.z]} rotation={[0, item.rotation, 0]} scale={item.scale}>
          {item.kind === 'tree' && <Tree variant={item.variant} />}
          {item.kind === 'pine' && <Pine />}
          {item.kind === 'rock' && <Rock />}
          {item.kind === 'bush' && <Bush />}
          {item.kind === 'fence' && <Fence />}
          {item.kind === 'barn' && <Barn />}
          {item.kind === 'windmill' && <Windmill animate={animate} />}
          {item.kind === 'silo' && <Silo />}
        </group>
      ))}
    </>
  )
}
