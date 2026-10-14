import { PALETTE } from '@/render/palette'
import { Flat } from '@/render/farm3d/materials'
import { PlantModel } from '@/render/farm3d/PlantModel'
import type { Cell } from '@/game/world/types'

interface PlotTileProps {
  cell: Cell
  position: [number, number, number]
  isGoal: boolean
  reducedMotion: boolean
}

const BED_HEIGHT = 0.18

function WoodFrame() {
  const rails: [number, number, number, number, number][] = [
    [0, 0.47, 0.96, 0.06, 0],
    [0, -0.47, 0.96, 0.06, 0],
    [0.47, 0, 0.06, 0.96, 0],
    [-0.47, 0, 0.06, 0.96, 0],
  ]
  return (
    <>
      {rails.map(([x, z, width, depth], index) => (
        <mesh key={index} position={[x, BED_HEIGHT + 0.02, z]} castShadow receiveShadow>
          <boxGeometry args={[width, 0.1, depth]} />
          <Flat color={PALETTE.woodFrame} />
        </mesh>
      ))}
    </>
  )
}

function Furrows() {
  return (
    <>
      {[-0.25, 0, 0.25].map((x) => (
        <mesh key={x} position={[x, BED_HEIGHT + 0.025, 0]} receiveShadow>
          <boxGeometry args={[0.1, 0.05, 0.8]} />
          <Flat color={PALETTE.soilWet} />
        </mesh>
      ))}
    </>
  )
}

function WetMarker() {
  return (
    <group position={[0.3, BED_HEIGHT + 0.5, -0.3]}>
      <mesh>
        <sphereGeometry args={[0.07, 8, 6]} />
        <Flat color={PALETTE.water} emissive={PALETTE.water} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <coneGeometry args={[0.065, 0.12, 8]} />
        <Flat color={PALETTE.water} emissive={PALETTE.water} emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function GoalMarker() {
  return (
    <mesh position={[0, BED_HEIGHT + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.4, 0.46, 4, 1, Math.PI / 4]} />
      <meshBasicMaterial color={PALETTE.marker} />
    </mesh>
  )
}

function Soil({ cell, isGoal, reducedMotion }: Omit<PlotTileProps, 'position'>) {
  const prepared = cell.plot !== 'untilled'
  const wet = cell.moisture === 'wet'
  const color = !prepared ? PALETTE.soilUntilled : wet ? PALETTE.soilWet : PALETTE.soilDry
  return (
    <>
      <mesh position={[0, BED_HEIGHT / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.94, BED_HEIGHT, 0.94]} />
        <Flat color={color} />
      </mesh>
      {prepared && <WoodFrame />}
      {cell.plot === 'tilled' && <Furrows />}
      {wet && <WetMarker />}
      {isGoal && <GoalMarker />}
      {cell.plot !== 'untilled' && cell.plot !== 'tilled' && (
        <group position={[0, BED_HEIGHT, 0]}>
          <PlantModel key={cell.plot} stage={cell.plot} reducedMotion={reducedMotion} />
        </group>
      )}
    </>
  )
}

function Grass() {
  return (
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[0.98, 0.1, 0.98]} />
      <Flat color={PALETTE.grassMid} />
    </mesh>
  )
}

export function PlotTile({ cell, position, isGoal, reducedMotion }: PlotTileProps) {
  return (
    <group position={position}>
      {cell.terrain === 'soil' && <Soil cell={cell} isGoal={isGoal} reducedMotion={reducedMotion} />}
      {cell.terrain === 'obstacle' && (
        <>
          <Grass />
          <mesh position={[0, 0.3, 0]} rotation={[0.3, 0.6, 0.1]} scale={[1, 0.75, 1]} castShadow>
            <dodecahedronGeometry args={[0.36, 0]} />
            <Flat color={PALETTE.rock} />
          </mesh>
          <mesh position={[0.25, 0.17, 0.22]} castShadow>
            <dodecahedronGeometry args={[0.14, 0]} />
            <Flat color={PALETTE.rockDark} />
          </mesh>
        </>
      )}
      {cell.terrain === 'blocked' && (
        <>
          <Grass />
          {[
            [-0.2, -0.2],
            [0.2, -0.15],
            [0, 0.2],
          ].map(([x, z], index) => (
            <mesh key={index} position={[x, 0.32, z]} castShadow>
              <icosahedronGeometry args={[0.28, 0]} />
              <Flat color={PALETTE.bush} />
            </mesh>
          ))}
        </>
      )}
      {cell.terrain === 'reservoir' && (
        <>
          <Grass />
          {[
            [-0.25, -0.25],
            [0.25, -0.25],
            [-0.25, 0.25],
            [0.25, 0.25],
          ].map(([x, z], index) => (
            <mesh key={index} position={[x, 0.25, z]}>
              <boxGeometry args={[0.06, 0.4, 0.06]} />
              <Flat color={PALETTE.metal} />
            </mesh>
          ))}
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.42, 10]} />
            <Flat color={PALETTE.water} />
          </mesh>
          <mesh position={[0, 0.83, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.05, 10]} />
            <Flat color={PALETTE.waterLight} />
          </mesh>
        </>
      )}
      {cell.terrain === 'seedDepot' && (
        <>
          <Grass />
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.6, 0.4, 0.5]} />
            <Flat color={PALETTE.crate} />
          </mesh>
          {[-0.15, 0.15].map((x) => (
            <mesh key={x} position={[x, 0.6, 0]} castShadow>
              <sphereGeometry args={[0.15, 6, 5]} />
              <Flat color={PALETTE.sack} />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}
