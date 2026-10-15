import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { RobotShowcase } from '@/render/farm3d/RobotModel'
import { PALETTE } from '@/render/palette'
import { buildWorld } from '@/render/world/buildWorld'
import { Butterflies } from '@/render/world/Butterflies'
import { CELEBRATION_BED_CENTERS, CELEBRATION_ROBOT } from '@/render/world/celebrationLayout'
import { Herd } from '@/render/world/Herd'
import { WorldProps } from '@/render/world/WorldProps'
import { WorldTerrain } from '@/render/world/WorldTerrain'

interface CelebrationSceneProps {
  reducedMotion: boolean
  lowGraphics: boolean
  onReady?: () => void
}

export default function CelebrationScene({ reducedMotion, lowGraphics, onReady }: CelebrationSceneProps) {
  const world = useMemo(() => buildWorld({ layout: 'celebration', gridWidth: 0, gridHeight: 0, seed: 'celebration', density: lowGraphics ? 'light' : 'full' }), [lowGraphics])
  const alive = !reducedMotion && !lowGraphics

  return (
    <Canvas
      orthographic
      shadows={!lowGraphics}
      dpr={lowGraphics ? 1 : [1, 2]}
      camera={{ position: [16, 16, 16], zoom: 60, near: -200, far: 400 }}
      onCreated={() => onReady?.()}
      aria-hidden="true"
    >
      <color attach="background" args={[PALETTE.sky]} />
      <CameraRig gridWidth={3} gridHeight={3} quarterTurns={0} zoomLevel={0.8} showcase={false} reducedMotion={reducedMotion} />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.5}
        castShadow={!lowGraphics}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <WorldTerrain world={world} />
      <WorldProps world={world} shadows={!lowGraphics} ambient={alive} />
      <Herd animals={world.animals} active={alive} />
      <Butterflies points={world.butterflies} active={alive} />
      {CELEBRATION_BED_CENTERS.map((center) => (
        <PlotTile
          key={`${center.x}:${center.z}`}
          cell={{ terrain: 'soil', plot: 'mature', moisture: 'dry', growth: 0 }}
          position={[center.x, 0, center.z]}
          isGoal={false}
          reducedMotion={reducedMotion}
        />
      ))}
      <group position={[CELEBRATION_ROBOT.x, 0, CELEBRATION_ROBOT.z]} rotation={[0, Math.PI / 4, 0]} scale={1.6}>
        <RobotShowcase clip="success" tool="crate" reducedMotion={reducedMotion} />
      </group>
    </Canvas>
  )
}
