import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { FarmSceneProps } from '@/render/FarmView'
import { PALETTE } from '@/render/palette'
import { cellToWorld, generateDecorations } from '@/render/sceneLayout'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { CellLocatorBridge } from '@/render/farm3d/CellLocatorBridge'
import { Decorations } from '@/render/farm3d/Decorations'
import { EffectsLayer } from '@/render/farm3d/Effects'
import { Flat } from '@/render/farm3d/materials'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { RobotModel } from '@/render/farm3d/RobotModel'

export default function FarmScene({
  state,
  lastEvents,
  eventKey,
  stepDurationMs,
  highlightCells,
  failed,
  seedKey,
  quarterTurns,
  zoomLevel,
  lowGraphics,
  reducedMotion,
  showcase = false,
}: FarmSceneProps) {
  const { width, height } = state
  const decorations = useMemo(
    () => generateDecorations(width, height, seedKey, { dense: !lowGraphics }),
    [width, height, seedKey, lowGraphics],
  )
  const goals = useMemo(() => new Set(highlightCells.map(([x, y]) => `${x},${y}`)), [highlightCells])
  const duration = reducedMotion ? 0 : stepDurationMs

  return (
    <Canvas
      orthographic
      shadows={!lowGraphics}
      dpr={lowGraphics ? 1 : [1, 2]}
      camera={{ position: [16, 16, 16], zoom: 40, near: -200, far: 400 }}
      gl={{ antialias: !lowGraphics, preserveDrawingBuffer: false }}
      aria-hidden="true"
    >
      <color attach="background" args={[PALETTE.sky]} />
      <CameraRig
        gridWidth={width}
        gridHeight={height}
        quarterTurns={quarterTurns}
        zoomLevel={zoomLevel}
        showcase={showcase}
        reducedMotion={reducedMotion}
      />
      <CellLocatorBridge width={width} height={height} />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.5}
        castShadow={!lowGraphics}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[width + 18, 0.1, height + 16]} />
        <Flat color={PALETTE.grassLight} />
      </mesh>
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[width + 0.6, 0.06, height + 0.6]} />
        <Flat color={PALETTE.grassDark} />
      </mesh>
      <Decorations items={decorations} animate={!reducedMotion} />
      {state.cells.map((row, y) =>
        row.map((cell, x) => {
          const point = cellToWorld(x, y, width, height)
          return (
            <PlotTile
              key={`${x}-${y}`}
              cell={cell}
              position={[point.x, 0, point.z]}
              isGoal={goals.has(`${x},${y}`)}
              reducedMotion={reducedMotion}
            />
          )
        }),
      )}
      <RobotModel robot={state.robot} gridWidth={width} gridHeight={height} durationMs={duration} failed={failed} />
      {!lowGraphics && !reducedMotion && (
        <EffectsLayer events={lastEvents} eventKey={eventKey} gridWidth={width} gridHeight={height} durationMs={stepDurationMs} />
      )}
    </Canvas>
  )
}
