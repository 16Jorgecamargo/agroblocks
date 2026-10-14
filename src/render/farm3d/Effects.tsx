import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { PALETTE } from '@/render/palette'
import { cellToWorld } from '@/render/sceneLayout'
import type { GameEvent } from '@/game/world/types'

interface EffectProps {
  x: number
  z: number
  durationMs: number
}

function useLifetime(durationMs: number) {
  const started = useRef(performance.now())
  const [alive, setAlive] = useState(true)
  const progress = () => Math.min(1, (performance.now() - started.current) / Math.max(durationMs, 1))
  useFrame(() => {
    if (alive && progress() >= 1) setAlive(false)
  })
  return { alive, progress }
}

function WaterSplash({ x, z, durationMs }: EffectProps) {
  const ref = useRef<Group>(null)
  const { alive, progress } = useLifetime(durationMs)
  useFrame(() => {
    if (ref.current) ref.current.position.y = 1.1 - progress() * 0.8
  })
  if (!alive) return null
  return (
    <group ref={ref} position={[x, 1.1, z]}>
      {[
        [-0.15, 0],
        [0.12, 0.1],
        [0, -0.14],
        [0.18, -0.08],
      ].map(([dx, dz], index) => (
        <mesh key={index} position={[dx, index * 0.08, dz]}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshBasicMaterial color={PALETTE.waterLight} />
        </mesh>
      ))}
    </group>
  )
}

function HarvestPop({ x, z, durationMs }: EffectProps) {
  const ref = useRef<Group>(null)
  const { alive, progress } = useLifetime(durationMs)
  useFrame(() => {
    if (!ref.current) return
    const value = progress()
    ref.current.position.y = 0.5 + value * 1.2
    ref.current.scale.setScalar(1 - value * 0.6)
  })
  if (!alive) return null
  return (
    <group ref={ref} position={[x, 0.5, z]}>
      <mesh>
        <icosahedronGeometry args={[0.14, 1]} />
        <meshBasicMaterial color={PALETTE.fruit} />
      </mesh>
    </group>
  )
}

function SeedPuff({ x, z, durationMs }: EffectProps) {
  const ref = useRef<Group>(null)
  const { alive, progress } = useLifetime(durationMs)
  useFrame(() => {
    if (ref.current) ref.current.scale.setScalar(0.4 + progress() * 1.2)
  })
  if (!alive) return null
  return (
    <group ref={ref} position={[x, 0.3, z]}>
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh key={index} position={[Math.cos(index * 1.25) * 0.2, 0.05, Math.sin(index * 1.25) * 0.2]}>
          <sphereGeometry args={[0.035, 5, 4]} />
          <meshBasicMaterial color={PALETTE.soilTilled} />
        </mesh>
      ))}
    </group>
  )
}

interface EffectsLayerProps {
  events: GameEvent[]
  eventKey: number
  gridWidth: number
  gridHeight: number
  durationMs: number
}

export function EffectsLayer({ events, eventKey, gridWidth, gridHeight, durationMs }: EffectsLayerProps) {
  const lifetime = Math.max(durationMs, 350)
  return (
    <>
      {events.map((event, index) => {
        const key = `${eventKey}-${index}`
        if (event.type === 'moistureChanged' && event.moisture === 'wet') {
          const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
          return <WaterSplash key={key} x={point.x} z={point.z} durationMs={lifetime} />
        }
        if (event.type === 'plotChanged' && event.to === 'harvested') {
          const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
          return <HarvestPop key={key} x={point.x} z={point.z} durationMs={lifetime} />
        }
        if (event.type === 'plotChanged' && (event.to === 'seeded' || event.to === 'tilled')) {
          const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
          return <SeedPuff key={key} x={point.x} z={point.z} durationMs={lifetime} />
        }
        return null
      })}
    </>
  )
}
