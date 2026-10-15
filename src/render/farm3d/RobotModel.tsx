import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import type { Group } from 'three'
import { BASE_STEP_DELAY_MS } from '@/game/execution/types'
import { ERROR_SHAKE } from '@/motion/presets'
import { scaleSpring, SPRINGS } from '@/motion/springs'
import { PALETTE } from '@/render/palette'
import { shakeTrack } from '@/render/farm3d/robotMotion'
import { AnimatedRobot } from '@/render/robot/AnimatedRobot'
import { clipForStep } from '@/render/robot/clipForStep'
import { clipSecondsFor, type RobotClip, type RobotTool } from '@/render/robot/robotPoses'
import { cellToWorld, FACING_YAW } from '@/render/sceneLayout'
import type { GameEvent, Robot } from '@/game/world/types'

export function RobotShowcase({ clip, tool, reducedMotion = false }: { clip: RobotClip; tool?: RobotTool; reducedMotion?: boolean }) {
  return <AnimatedRobot clip={clip} reducedMotion={reducedMotion} tool={tool} />
}

function shortestAngle(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2)
  if (diff > Math.PI) diff -= Math.PI * 2
  if (diff < -Math.PI) diff += Math.PI * 2
  return from + diff
}

interface RobotModelProps {
  robot: Robot
  events: GameEvent[]
  eventKey: number
  gridWidth: number
  gridHeight: number
  durationMs: number
  failed: boolean
  celebrating: boolean
  reducedMotion: boolean
}

export function RobotModel({ robot, events, eventKey, gridWidth, gridHeight, durationMs, failed, celebrating, reducedMotion }: RobotModelProps) {
  const ref = useRef<Group>(null)
  const [moving, setMoving] = useState(false)
  const target = cellToWorld(robot.x, robot.y, gridWidth, gridHeight)
  const [initial] = useState(() => ({ x: target.x, z: target.z, yaw: FACING_YAW[robot.facing] }))
  const speed = durationMs > 0 ? BASE_STEP_DELAY_MS / durationMs : 1
  const clip = clipForStep({ events, failed, celebrating, moving })

  useEffect(() => {
    const group = ref.current
    if (!group) return
    const yaw = FACING_YAW[robot.facing]
    if (reducedMotion || durationMs <= 0) {
      group.position.set(target.x, 0.18, target.z)
      group.rotation.y = yaw
      setMoving(false)
      return
    }
    setMoving(true)
    const move = animate(group.position, { x: target.x, z: target.z }, scaleSpring(SPRINGS.smooth, speed))
    const turn = animate(group.rotation, { y: shortestAngle(group.rotation.y, yaw) }, scaleSpring(SPRINGS.snap, speed))
    Promise.all([move, turn]).then(() => setMoving(false))
    return () => {
      move.stop()
      turn.stop()
      setMoving(false)
    }
  }, [target.x, target.z, robot.facing, reducedMotion, durationMs, speed])

  useEffect(() => {
    const group = ref.current
    if (!group || !failed || reducedMotion) return
    group.position.z = target.z
    const shake = animate(group.position, { x: shakeTrack(target.x) }, ERROR_SHAKE.options)
    return () => shake.stop()
  }, [failed, reducedMotion, target.x, target.z])

  return (
    <group ref={ref} position={[initial.x, 0.18, initial.z]} rotation={[0, initial.yaw, 0]}>
      <AnimatedRobot clip={clip} playKey={eventKey} clipSeconds={clipSecondsFor(clip, durationMs)} reducedMotion={reducedMotion} failed={failed} />
      <mesh position={[0, 0.03, 0.62]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <circleGeometry args={[0.16, 3]} />
        <meshBasicMaterial color={PALETTE.arrow} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
