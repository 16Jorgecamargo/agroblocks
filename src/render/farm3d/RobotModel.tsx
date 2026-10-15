import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { RoundedBox, useAnimations, useGLTF } from '@react-three/drei'
import { animate } from 'motion'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { BASE_STEP_DELAY_MS } from '@/game/execution/types'
import { ERROR_SHAKE } from '@/motion/presets'
import { scaleSpring, SPRINGS } from '@/motion/springs'
import { Flat } from '@/render/farm3d/materials'
import { modelEntry, modelUrl, type ModelEntry } from '@/render/models/manifest'
import { ModelBoundary, useClonedScene } from '@/render/models/Model'
import { robotClipFor, type RobotClip } from '@/render/models/modelChoice'
import { PALETTE } from '@/render/palette'
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

function RobotGltf({ entry, clip }: { entry: ModelEntry; clip: RobotClip }) {
  const object = useClonedScene(entry)
  const { animations } = useGLTF(modelUrl(entry))
  const recolored = useMemo(() => {
    object.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      const material = mesh.material as MeshStandardMaterial
      const color = entry.recolor?.[material.name]
      if (!color) return
      const copy = material.clone()
      copy.color.set(color)
      mesh.material = copy
    })
    return object
  }, [object, entry])
  const { actions } = useAnimations(animations, recolored)

  useEffect(() => {
    const name = entry.clips?.[clip]
    const action = name ? actions[name] : undefined
    if (!action) return
    action.reset().fadeIn(0.2).play()
    return () => {
      action.fadeOut(0.2)
    }
  }, [clip, actions, entry])

  return <primitive object={recolored} scale={entry.scale} position={[0, entry.yOffset, 0]} rotation={[0, entry.rotationY, 0]} />
}

function RobotVisual({ clip, failed }: { clip: RobotClip; failed: boolean }) {
  const entry = modelEntry('robot')
  const fallback = (
    <group scale={1.3}>
      <RobotBody failed={failed} />
    </group>
  )
  if (!entry) return fallback
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <RobotGltf entry={entry} clip={clip} />
      </Suspense>
    </ModelBoundary>
  )
}

export function RobotShowcase({ clip }: { clip: RobotClip }) {
  return <RobotVisual clip={clip} failed={false} />
}

function shortestAngle(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2)
  if (diff > Math.PI) diff -= Math.PI * 2
  if (diff < -Math.PI) diff += Math.PI * 2
  return from + diff
}

interface RobotModelProps {
  robot: Robot
  gridWidth: number
  gridHeight: number
  durationMs: number
  failed: boolean
  celebrating: boolean
  reducedMotion: boolean
}

export function RobotModel({ robot, gridWidth, gridHeight, durationMs, failed, celebrating, reducedMotion }: RobotModelProps) {
  const ref = useRef<Group>(null)
  const [moving, setMoving] = useState(false)
  const target = cellToWorld(robot.x, robot.y, gridWidth, gridHeight)
  const [initial] = useState(() => ({ x: target.x, z: target.z, yaw: FACING_YAW[robot.facing] }))
  const speed = durationMs > 0 ? BASE_STEP_DELAY_MS / durationMs : 1

  useEffect(() => {
    const group = ref.current
    if (!group) return
    const yaw = FACING_YAW[robot.facing]
    if (reducedMotion || durationMs <= 0) {
      group.position.set(target.x, 0.18, target.z)
      group.rotation.y = yaw
      return
    }
    setMoving(true)
    const move = animate(group.position, { x: target.x, z: target.z }, scaleSpring(SPRINGS.smooth, speed))
    const turn = animate(group.rotation, { y: shortestAngle(group.rotation.y, yaw) }, scaleSpring(SPRINGS.snap, speed))
    Promise.all([move, turn]).then(() => setMoving(false))
    return () => {
      move.stop()
      turn.stop()
    }
  }, [target.x, target.z, robot.facing, reducedMotion, durationMs, speed])

  useEffect(() => {
    const group = ref.current
    if (!group || !failed || reducedMotion) return
    const x = group.position.x
    const shake = animate(group.position, { x: ERROR_SHAKE.keyframes.x.map((offset) => x + offset / 120) }, ERROR_SHAKE.options)
    return () => shake.stop()
  }, [failed, reducedMotion])

  return (
    <group ref={ref} position={[initial.x, 0.18, initial.z]} rotation={[0, initial.yaw, 0]}>
      <RobotVisual clip={robotClipFor({ moving, failed, celebrating })} failed={failed} />
      <mesh position={[0, 0.03, 0.62]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <circleGeometry args={[0.16, 3]} />
        <meshBasicMaterial color={PALETTE.arrow} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
