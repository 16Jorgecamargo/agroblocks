import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { animate } from 'motion'
import type { Group, PerspectiveCamera } from 'three'
import { EASINGS } from '@/motion/easings'
import { Barn, Tree, Windmill } from '@/render/farm3d/Decorations'
import { Flat } from '@/render/farm3d/materials'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { RobotBody } from '@/render/farm3d/RobotModel'
import { PALETTE } from '@/render/palette'
import { createRandom, hashString } from '@/render/seededRandom'
import type { Cell } from '@/game/world/types'

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
    const controls = animate(sway.current, { value: [0, 1, 0] }, { duration: 14, repeat: Infinity, ease: EASINGS.easeInOutSine })
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
  const ref = useRef<Group>(null)
  useEffect(() => {
    const group = ref.current
    if (!group || !ambient) return
    const bob = animate(group.position, { y: [0.2, 0.32, 0.2] }, { duration: 2.4, repeat: Infinity, ease: EASINGS.easeInOutSine })
    const look = animate(group.rotation, { y: [-0.55, -0.25, -0.55] }, { duration: 6, repeat: Infinity, ease: EASINGS.easeInOutSine })
    return () => {
      bob.stop()
      look.stop()
    }
  }, [ambient])
  return (
    <group ref={ref} position={[3.4, 0.2, 4.6]} rotation={[0, -0.55, 0]} scale={1.7}>
      <RobotBody />
    </group>
  )
}

export default function HomeLandscape({ ambient, lowGraphics }: { ambient: boolean; lowGraphics: boolean }) {
  const trees = useMemo(() => {
    const random = createRandom(hashString('home-landscape'))
    return Array.from({ length: lowGraphics ? 14 : 34 }, (_, index) => {
      const side = index % 2 === 0 ? -1 : 1
      return {
        x: side * (4 + random() * 14),
        z: -4 - random() * 16,
        scale: 0.9 + random() * 0.9,
        variant: index % 3,
      }
    })
  }, [lowGraphics])

  return (
    <Canvas shadows={!lowGraphics} dpr={lowGraphics ? 1 : [1, 2]} camera={{ fov: 42, position: [0, 2.6, 10.5], near: 0.1, far: 200 }} gl={{ alpha: true }} aria-hidden="true">
      <fog attach="fog" args={['#e9d8e6', 22, 60]} />
      <CameraDrift ambient={ambient} />
      <hemisphereLight args={['#fff4e6', '#5c8f3e', 1]} />
      <directionalLight position={[-8, 12, 6]} intensity={1.6} color="#fff1d6" castShadow={!lowGraphics} shadow-mapSize={[1024, 1024]} />
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
      {trees.map((tree, index) => (
        <group key={index} position={[tree.x, 0, tree.z]} scale={tree.scale}>
          <Tree variant={tree.variant} />
        </group>
      ))}
      <group position={[-6, 0, -3.2]} rotation={[0, -1.15, 0]} scale={1.1}>
        <Barn />
      </group>
      <group position={[-1.2, 0, -11]} rotation={[0, -1.4, 0]} scale={0.7}>
        <Barn />
      </group>
      <group position={[6.8, 0, -3.5]} rotation={[0, -0.4, 0]} scale={1.3}>
        <Windmill animate={ambient} />
      </group>
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
      {[-3, -2, -1, 0, 1, 2, 3].map((x) => (
        <group key={x} position={[x + 0.6, 0, 3.4]}>
          <mesh position={[-0.42, 0.25, 0]} castShadow>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <Flat color={PALETTE.fence} />
          </mesh>
          {[0.18, 0.36].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <boxGeometry args={[1, 0.07, 0.05]} />
              <Flat color={PALETTE.fence} />
            </mesh>
          ))}
        </group>
      ))}
      <IdleRobot ambient={ambient} />
    </Canvas>
  )
}
