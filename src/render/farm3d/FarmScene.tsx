import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { FarmSceneProps } from '@/render/FarmView'
import { PALETTE } from '@/render/palette'
import { cellToWorld } from '@/render/sceneLayout'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { CellLocatorBridge } from '@/render/farm3d/CellLocatorBridge'
import { EffectsLayer } from '@/render/farm3d/Effects'
import { Flat } from '@/render/farm3d/materials'
import { resolveCrop } from '@/render/crops/cropShape'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { WORLD_THEMES } from '@/render/world/worldThemes'
import { SceneLighting } from '@/render/world/SceneLighting'
import { RobotModel } from '@/render/farm3d/RobotModel'
import { buildWorld } from '@/render/world/buildWorld'
import { Actors } from '@/render/world/actors/Actors'
import { Birds } from '@/render/world/Birds'
import { Butterflies } from '@/render/world/Butterflies'
import { Herd } from '@/render/world/Herd'
import { InstancedFeatures } from '@/render/world/InstancedFeatures'
import { WorldProps } from '@/render/world/WorldProps'
import { WorldTerrain } from '@/render/world/WorldTerrain'
import { CANVAS_RESIZE } from '@/render/canvasResize'
import { DrawCallProbe } from '@/render/DrawCallProbe'

export default function FarmScene({
  state,
  lastEvents,
  eventKey,
  stepDurationMs,
  highlightCells,
  failed,
  seedKey,
  theme = null,
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
    () => buildWorld({ layout: 'farm', gridWidth: width, gridHeight: height, seed: seedKey, density: lowGraphics ? 'light' : 'full', theme }),
    [width, height, seedKey, lowGraphics, theme],
  )
  const goals = useMemo(() => new Set(highlightCells.map(([x, y]) => `${x},${y}`)), [highlightCells])
  const duration = reducedMotion ? 0 : stepDurationMs

  return (
    <Canvas resize={CANVAS_RESIZE}
      orthographic
      shadows={!lowGraphics}
      dpr={lowGraphics ? 1 : [1, 2]}
      camera={{ position: [16, 16, 16], zoom: 40, near: -200, far: 400 }}
      gl={{ antialias: !lowGraphics, preserveDrawingBuffer: false }}
      onCreated={() => onReady?.()}
      aria-hidden="true"
    >
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
      <DrawCallProbe />
      <SceneLighting style={world.style} shadows={!lowGraphics} shadowExtent={26} />
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[width + 0.6, 0.06, height + 0.6]} />
        <Flat color={theme ? world.style.palette.grassDeep : PALETTE.grassDark} />
      </mesh>
      <WorldTerrain world={world} />
      <WorldProps world={world} shadows={!lowGraphics} ambient={!reducedMotion && !lowGraphics} />
      <InstancedFeatures features={world.features} ambient={!reducedMotion && !lowGraphics} shadows={!lowGraphics} />
      <Herd animals={world.animals} active={!reducedMotion && !lowGraphics} />
      <Butterflies points={world.butterflies} active={!reducedMotion && !lowGraphics} />
      <Birds points={world.birds ?? []} active={!reducedMotion && !lowGraphics} />
      <Actors actors={world.actors ?? []} active={!reducedMotion && !lowGraphics} shadows={!lowGraphics} />
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
              crop={resolveCrop(theme ? WORLD_THEMES[theme].crop : 'vegetable', x, y)}
            />
          )
        }),
      )}
      <RobotModel
        robot={state.robot}
        events={lastEvents}
        eventKey={eventKey}
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
