import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import type { Group } from 'three'
import { EASINGS } from '@/motion/easings'
import { SPRINGS } from '@/motion/springs'
import { PALETTE } from '@/render/palette'
import { effectKind } from '@/render/farm3d/effectKind'
import { cellToWorld } from '@/render/sceneLayout'
import type { GameEvent } from '@/game/world/types'

interface EffectProps {
  x: number
  z: number
  seconds: number
}

function useFinished(): [boolean, () => void] {
  const [finished, setFinished] = useState(false)
  return [finished, () => setFinished(true)]
}

function WaterSplash({ x, z, seconds }: EffectProps) {
  const ref = useRef<Group>(null)
  const [finished, finish] = useFinished()
  useEffect(() => {
    const group = ref.current
    if (!group) return
    const controls = animate(group.position, { y: [1.2, 0.25] }, { duration: seconds, ease: EASINGS.easeInQuad })
    controls.then(finish)
    return () => controls.stop()
  }, [seconds])
  if (finished) return null
  return (
    <group ref={ref} position={[x, 1.2, z]}>
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

function HarvestPop({ x, z, seconds }: EffectProps) {
  const ref = useRef<Group>(null)
  const [finished, finish] = useFinished()
  useEffect(() => {
    const group = ref.current
    if (!group) return
    const lift = animate(group.position, { y: [0.5, 1.7, 1.4] }, { duration: seconds, ease: EASINGS.easeOutCubic })
    const shrink = animate(group.scale, { x: [1, 1.3, 0], y: [1, 1.3, 0], z: [1, 1.3, 0] }, { duration: seconds, ease: EASINGS.easeInCubic })
    Promise.all([lift, shrink]).then(finish)
    return () => {
      lift.stop()
      shrink.stop()
    }
  }, [seconds])
  if (finished) return null
  return (
    <group ref={ref} position={[x, 0.5, z]}>
      <mesh>
        <icosahedronGeometry args={[0.14, 1]} />
        <meshBasicMaterial color={PALETTE.fruit} />
      </mesh>
    </group>
  )
}

function SeedDrop({ x, z }: EffectProps) {
  const ref = useRef<Group>(null)
  const [finished, finish] = useFinished()
  useEffect(() => {
    const group = ref.current
    if (!group) return
    const controls = animate(group.position, { y: [1, 0.22] }, SPRINGS.bounce)
    controls.then(finish)
    return () => controls.stop()
  }, [])
  if (finished) return null
  return (
    <group ref={ref} position={[x, 1, z]}>
      <mesh>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshBasicMaterial color={PALETTE.soilTilled} />
      </mesh>
    </group>
  )
}

function SoilBurst({ x, z, seconds }: EffectProps) {
  const ref = useRef<Group>(null)
  const [finished, finish] = useFinished()
  useEffect(() => {
    const group = ref.current
    if (!group) return
    const controls = group.children.map((child, index) => {
      const angle = (index / group.children.length) * Math.PI * 2
      return animate(child.position, { x: [0, Math.cos(angle) * 0.35], y: [0.2, 0.5, 0.18], z: [0, Math.sin(angle) * 0.35] }, { duration: seconds, ease: EASINGS.easeOutCubic })
    })
    Promise.all(controls).then(finish)
    return () => controls.forEach((control) => control.stop())
  }, [seconds])
  if (finished) return null
  return (
    <group ref={ref} position={[x, 0, z]}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <mesh key={index} position={[0, 0.2, 0]}>
          <dodecahedronGeometry args={[0.045, 0]} />
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
  const seconds = Math.max(durationMs, 350) / 1000
  return (
    <>
      {events.map((event, index) => {
        const kind = effectKind(event)
        if (!kind || !('x' in event)) return null
        const key = `${eventKey}-${index}`
        const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
        if (kind === 'water') return <WaterSplash key={key} x={point.x} z={point.z} seconds={seconds} />
        if (kind === 'harvest') return <HarvestPop key={key} x={point.x} z={point.z} seconds={seconds} />
        if (kind === 'seed') return <SeedDrop key={key} x={point.x} z={point.z} seconds={seconds} />
        return <SoilBurst key={key} x={point.x} z={point.z} seconds={seconds} />
      })}
    </>
  )
}
