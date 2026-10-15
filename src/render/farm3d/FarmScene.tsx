import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { FarmSceneProps } from '@/render/FarmView'
import { PALETTE } from '@/render/palette'
import { cellToWorld } from '@/render/sceneLayout'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { CellLocatorBridge } from '@/render/farm3d/CellLocatorBridge'
import { EffectsLayer } from '@/render/farm3d/Effects'
import { Flat } from '@/render/farm3d/materials'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { RobotModel } from '@/render/farm3d/RobotModel'
import { buildWorld } from '@/render/world/buildWorld'
import { Butterflies } from '@/render/world/Butterflies'
import { Herd } from '@/render/world/Herd'
import { WorldProps } from '@/render/world/WorldProps'
import { WorldTerrain } from '@/render/world/WorldTerrain'

export default function FarmScene({
  state,
  lastEvents,
  eventKey,
  stepDurationMs,
  highlightCells,
  failed,
  seedKey,
  celebrating,
  quarterTurns,
  zoomLevel,
  lowGraphics,
  reducedMotion,
  showcase = false,
  onReady,
}: FarmSceneProps) {
  const { width, height } = state
  const world = useMemo(
    () => buildWorld({ layout: 'farm', gridWidth: width, gridHeight: height, seed: seedKey, density: lowGraphics ? 'light' : 'full' }),
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
      onCreated={() => onReady?.()}
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
        kickKey={failed ? eventKey : 0}
      />
      <CellLocatorBridge width={width} height={height} />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.5}
        castShadow={!lowGraphics}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
      />
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[width + 0.6, 0.06, height + 0.6]} />
        <Flat color={PALETTE.grassDark} />
      </mesh>
      <WorldTerrain world={world} />
      <WorldProps world={world} shadows={!lowGraphics} ambient={!reducedMotion && !lowGraphics} />
      <Herd animals={world.animals} active={!reducedMotion && !lowGraphics} />
      <Butterflies points={world.butterflies} active={!reducedMotion && !lowGraphics} />
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
      <RobotModel
        robot={state.robot}
        gridWidth={width}
        gridHeight={height}
        durationMs={duration}
        failed={failed}
        celebrating={celebrating}
        reducedMotion={reducedMotion}
      />
      {!lowGraphics && !reducedMotion && (
        <EffectsLayer events={lastEvents} eventKey={eventKey} gridWidth={width} gridHeight={height} durationMs={stepDurationMs} />
      )}
    </Canvas>
  )
}
