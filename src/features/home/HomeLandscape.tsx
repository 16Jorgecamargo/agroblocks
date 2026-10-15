import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { animate } from 'motion'
import type { PerspectiveCamera } from 'three'
import { EASINGS } from '@/motion/easings'
import { Flat } from '@/render/farm3d/materials'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { RobotShowcase } from '@/render/farm3d/RobotModel'
import { PALETTE } from '@/render/palette'
import { buildWorld } from '@/render/world/buildWorld'
import { Butterflies } from '@/render/world/Butterflies'
import { Herd } from '@/render/world/Herd'
import { WorldProps } from '@/render/world/WorldProps'
import { WorldTerrain } from '@/render/world/WorldTerrain'
import type { Cell } from '@/game/world/types'
import { DURATIONS } from '@/motion/presets'

const HILLS: [number, number, number, number, string][] = [
  [-14, -26, 16, 5, '#7fb35a'],
  [2, -30, 20, 6, '#8cc065'],
  [18, -24, 14, 5, '#76ab52'],
  [-24, -18, 12, 4, '#88bb60'],
]

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

function IdleRobot({ ambient }: { ambient: boolean }) {
  return (
    <group position={[2.9, 0, 4.3]} rotation={[0, -0.45, 0]} scale={1.3}>
      <RobotShowcase clip="idle" reducedMotion={!ambient} />
    </group>
  )
}

export default function HomeLandscape({ ambient, lowGraphics, onReady }: { ambient: boolean; lowGraphics: boolean; onReady?: () => void }) {
  const world = useMemo(() => buildWorld({ layout: 'home', gridWidth: 0, gridHeight: 0, seed: 'home-landscape', density: lowGraphics ? 'light' : 'full' }), [lowGraphics])
  const alive = ambient && !lowGraphics

  return (
    <Canvas shadows={!lowGraphics} dpr={lowGraphics ? 1 : [1, 2]} camera={{ fov: 42, position: [0, 2.6, 10.5], near: 0.1, far: 200 }} gl={{ alpha: true }} onCreated={() => onReady?.()} aria-hidden="true">
      <fog attach="fog" args={['#e9d8e6', 22, 60]} />
      <CameraDrift ambient={ambient} />
      <hemisphereLight args={['#fff4e6', '#5c8f3e', 1]} />
      <directionalLight position={[-8, 12, 6]} intensity={1.6} color="#fff1d6" castShadow={!lowGraphics} shadow-mapSize={[2048, 2048]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]} receiveShadow>
        <planeGeometry args={[120, 80]} />
        <Flat color={PALETTE.grassLight} />
      </mesh>
      {HILLS.map(([x, z, width, height, color], index) => (
        <mesh key={index} position={[x, -1, z]} scale={[width, height, 6]}>
          <icosahedronGeometry args={[1, 1]} />
          <Flat color={color} />
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
