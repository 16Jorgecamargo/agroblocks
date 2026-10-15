import { useEffect, useRef } from 'react'
import { animate } from 'motion'
import { DoubleSide, type Group, type Mesh } from 'three'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { butterflyPath } from '@/render/world/ambientLoops'
import type { Vec2 } from '@/render/world/worldTypes'

const WING_COLORS = ['#fff6d6', '#ffd23f', '#ff9f43', '#9ad0ff', '#ffffff'] as const

function Butterfly({ center, index }: { center: Vec2; index: number }) {
  const body = useRef<Group>(null)
  const left = useRef<Mesh>(null)
  const right = useRef<Mesh>(null)
  useEffect(() => {
    const group = body.current
    if (!group || !left.current || !right.current) return
    const path = butterflyPath(center, index * 1.7)
    const flight = animate(group.position, path, { duration: DURATIONS.butterflyLoop, repeat: Infinity, ease: EASINGS.easeInOutSine })
    const leftFlap = animate(left.current.rotation, { z: [0.2, 1.2, 0.2] }, { duration: DURATIONS.wingFlap, repeat: Infinity })
    const rightFlap = animate(right.current.rotation, { z: [-0.2, -1.2, -0.2] }, { duration: DURATIONS.wingFlap, repeat: Infinity })
    return () => {
      flight.stop()
      leftFlap.stop()
      rightFlap.stop()
    }
  }, [center, index])
  const color = WING_COLORS[index % WING_COLORS.length]
  return (
    <group ref={body} position={[center.x, 0.8, center.z]} scale={0.6}>
      <mesh ref={left} position={[-0.06, 0, 0]}>
        <planeGeometry args={[0.12, 0.1]} />
        <meshStandardMaterial color={color} side={DoubleSide} />
      </mesh>
      <mesh ref={right} position={[0.06, 0, 0]}>
        <planeGeometry args={[0.12, 0.1]} />
        <meshStandardMaterial color={color} side={DoubleSide} />
      </mesh>
    </group>
  )
}

export function Butterflies({ points, active }: { points: Vec2[]; active: boolean }) {
  if (!active) return null
  return (
    <group>
      {points.map((point, index) => (
        <Butterfly key={index} center={point} index={index} />
      ))}
    </group>
  )
}
