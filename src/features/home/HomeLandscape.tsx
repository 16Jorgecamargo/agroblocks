import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { animate } from 'motion'
import { Plane, Raycaster, Vector2, Vector3, type Group, type PerspectiveCamera } from 'three'
import { EASINGS } from '@/motion/easings'
import { Flat } from '@/render/farm3d/materials'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { RobotShowcase } from '@/render/farm3d/RobotModel'
import type { Gaze } from '@/render/robot/AnimatedRobot'
import { PALETTE } from '@/render/palette'
import { buildWorld } from '@/render/world/buildWorld'
import { Butterflies } from '@/render/world/Butterflies'
import { Herd } from '@/render/world/Herd'
import { HILL_BASE_Y, HOME_HILLS } from '@/render/world/hillScatter'
import { WorldProps } from '@/render/world/WorldProps'
import { WorldTerrain } from '@/render/world/WorldTerrain'
import type { Cell } from '@/game/world/types'
import { DURATIONS } from '@/motion/presets'
import { CANVAS_RESIZE } from '@/render/canvasResize'


const BED_CELLS: Cell['plot'][] = ['mature', 'growing', 'mature', 'seeded', 'mature', 'growing', 'mature', 'mature', 'growing', 'seeded', 'mature', 'growing']

function CameraDrift({ ambient }: { ambient: boolean }) {
  const camera = useThree((three) => three.camera) as PerspectiveCamera
  const sway = useRef({ value: 0 })

  useEffect(() => {
    if (!ambient) return
    const controls = animate(sway.current, { value: [0, 1, 0] }, { duration: DURATIONS.skySway, repeat: Infinity, ease: EASINGS.easeInOutSine })
    return () => controls.stop()
  }, [ambient])

  useFrame(() => {
    const offset = sway.current.value
    camera.position.set(-0.6 + offset * 1.2, 2.6, 10.5)
    camera.lookAt(0.4, 1.4, 0)
  })

  return null
}

const HEAD_HEIGHT = 0.9
const GAZE_DISTANCE = 3
const MAX_YAW = 1.1
const MAX_PITCH_UP = 0.45
const MAX_PITCH_DOWN = 0.3
const GAZE_FOLLOW = 8

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function useGaze(robot: RefObject<Group | null>) {
  const camera = useThree((three) => three.camera)
  const pointer = useRef<Vector2 | null>(null)
  const gaze = useRef<Gaze | null>(null)
  const tools = useMemo(() => ({ ray: new Raycaster(), plane: new Plane(), head: new Vector3(), facing: new Vector3(), hit: new Vector3() }), [])

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current = new Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useFrame((_, delta) => {
    const group = robot.current
    if (!group || !pointer.current) return
    const { ray, plane, head, facing, hit } = tools
    group.localToWorld(head.set(0, HEAD_HEIGHT, 0))
    camera.getWorldDirection(facing)
    plane.setFromNormalAndCoplanarPoint(facing, head.clone().addScaledVector(facing, -GAZE_DISTANCE))
    ray.setFromCamera(pointer.current, camera)
    if (!ray.ray.intersectPlane(plane, hit)) return
    const local = group.worldToLocal(hit.clone())
    local.y -= HEAD_HEIGHT
    const yaw = clamp(Math.atan2(local.x, local.z), -MAX_YAW, MAX_YAW)
    const pitch = clamp(-Math.atan2(local.y, Math.hypot(local.x, local.z)), -MAX_PITCH_UP, MAX_PITCH_DOWN)
    const blend = 1 - Math.exp(-delta * GAZE_FOLLOW)
    const current = gaze.current ?? { yaw: 0, pitch: 0 }
    gaze.current = { yaw: current.yaw + (yaw - current.yaw) * blend, pitch: current.pitch + (pitch - current.pitch) * blend }
  })

  return gaze
}

function IdleRobot({ ambient }: { ambient: boolean }) {
  const robot = useRef<Group>(null)
  const gaze = useGaze(robot)
  return (
    <group ref={robot} position={[2.9, 0, 4.3]} rotation={[0, -0.45, 0]} scale={1.3}>
      <RobotShowcase clip="idle" reducedMotion={!ambient} gaze={gaze} />
    </group>
  )
}

export default function HomeLandscape({ ambient, lowGraphics, onReady }: { ambient: boolean; lowGraphics: boolean; onReady?: () => void }) {
  const world = useMemo(() => buildWorld({ layout: 'home', gridWidth: 0, gridHeight: 0, seed: 'home-landscape', density: lowGraphics ? 'light' : 'full' }), [lowGraphics])
  const alive = ambient && !lowGraphics

  return (
    <Canvas resize={CANVAS_RESIZE} shadows={!lowGraphics} dpr={lowGraphics ? 1 : [1, 2]} camera={{ fov: 42, position: [0, 2.6, 10.5], near: 0.1, far: 200 }} gl={{ alpha: true }} onCreated={() => onReady?.()} aria-hidden="true">
      <fog attach="fog" args={['#e9d8e6', 22, 60]} />
      <CameraDrift ambient={ambient} />
      <hemisphereLight args={['#fff4e6', '#5c8f3e', 1]} />
      <directionalLight position={[-8, 12, 6]} intensity={1.6} color="#fff1d6" castShadow={!lowGraphics} shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]} receiveShadow>
        <planeGeometry args={[120, 80]} />
        <Flat color={PALETTE.grassLight} />
      </mesh>
      {HOME_HILLS.map((hill, index) => (
        <mesh key={index} position={[hill.x, HILL_BASE_Y, hill.z]} scale={[hill.width, hill.height, hill.depth]}>
          <icosahedronGeometry args={[1, 1]} />
          <Flat color={hill.color} />
        </mesh>
      ))}
      <WorldTerrain world={world} withGround={false} />
      <WorldProps world={world} shadows={!lowGraphics} ambient={alive} />
      <Herd animals={world.animals} active={alive} />
      <Butterflies points={world.butterflies} active={alive} />
      <group position={[0.6, 0, 1.6]} rotation={[0, -0.18, 0]}>
        {BED_CELLS.map((plot, index) => (
          <PlotTile
            key={index}
            cell={{ terrain: 'soil', plot, moisture: 'dry', growth: 0 }}
            position={[(index % 4) - 1.5, 0, Math.floor(index / 4) - 1]}
            isGoal={false}
            reducedMotion
          />
        ))}
      </group>
      <IdleRobot ambient={ambient} />
    </Canvas>
  )
}
