import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { PALETTE } from '@/render/palette'
import { Flat } from '@/render/farm3d/materials'
import { cellToWorld, FACING_YAW } from '@/render/sceneLayout'
import type { Robot } from '@/game/world/types'

export function RobotBody({ failed = false }: { failed?: boolean }) {
  return (
    <group>
      <RoundedBox args={[0.56, 0.5, 0.46]} radius={0.1} smoothness={3} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color={PALETTE.robotBody} roughness={0.5} emissive={failed ? PALETTE.error : '#000000'} emissiveIntensity={failed ? 0.35 : 0} />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.26, 0.04]} radius={0.05} smoothness={2} position={[0, 0.5, 0.235]}>
        <meshStandardMaterial color={PALETTE.robotVisor} roughness={0.3} />
      </RoundedBox>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.262]}>
          <circleGeometry args={[0.055, 16]} />
          <meshBasicMaterial color={failed ? PALETTE.error : PALETTE.robotEye} />
        </mesh>
      ))}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.14, 6]} />
        <Flat color={PALETTE.robotTrim} />
      </mesh>
      <mesh position={[0, 0.87, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshBasicMaterial color={PALETTE.robotEye} />
      </mesh>
      {[-0.31, 0.31].map((x) => (
        <mesh key={x} position={[x, 0.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.1, 14]} />
          <Flat color={PALETTE.wheel} />
        </mesh>
      ))}
    </group>
  )
}

interface RobotModelProps {
  robot: Robot
  gridWidth: number
  gridHeight: number
  durationMs: number
  failed: boolean
}

function shortestAngle(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2)
  if (diff > Math.PI) diff -= Math.PI * 2
  if (diff < -Math.PI) diff += Math.PI * 2
  return from + diff
}

export function RobotModel({ robot, gridWidth, gridHeight, durationMs, failed }: RobotModelProps) {
  const ref = useRef<Group>(null)
  const target = cellToWorld(robot.x, robot.y, gridWidth, gridHeight)
  const motion = useRef({
    fromX: target.x,
    fromZ: target.z,
    fromYaw: FACING_YAW[robot.facing],
    toX: target.x,
    toZ: target.z,
    toYaw: FACING_YAW[robot.facing],
    start: 0,
  })

  useEffect(() => {
    const group = ref.current
    const current = motion.current
    const fromYaw = group ? group.rotation.y : current.toYaw
    current.fromX = group ? group.position.x : current.toX
    current.fromZ = group ? group.position.z : current.toZ
    current.fromYaw = fromYaw
    current.toX = target.x
    current.toZ = target.z
    current.toYaw = shortestAngle(fromYaw, FACING_YAW[robot.facing])
    current.start = performance.now()
  }, [target.x, target.z, robot.facing])

  useFrame((three) => {
    const group = ref.current
    if (!group) return
    const current = motion.current
    const progress = durationMs <= 0 ? 1 : Math.min(1, (performance.now() - current.start) / durationMs)
    const eased = 1 - (1 - progress) * (1 - progress)
    group.position.x = current.fromX + (current.toX - current.fromX) * eased
    group.position.z = current.fromZ + (current.toZ - current.fromZ) * eased
    group.position.y = 0.18 + (progress < 1 ? Math.sin(progress * Math.PI) * 0.06 : 0)
    group.rotation.y = current.fromYaw + (current.toYaw - current.fromYaw) * eased
    if (failed && durationMs > 0) group.position.x += Math.sin(three.clock.elapsedTime * 40) * 0.02
  })

  return (
    <group ref={ref} position={[target.x, 0.18, target.z]} rotation={[0, FACING_YAW[robot.facing], 0]}>
      <group scale={1.3}>
        <RobotBody failed={failed} />
      </group>
      <mesh position={[0, 0.03, 0.62]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <circleGeometry args={[0.16, 3]} />
        <meshBasicMaterial color={PALETTE.arrow} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
