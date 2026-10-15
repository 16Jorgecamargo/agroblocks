import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { ribbonGeometry } from '@/render/world/ribbon'
import { WORLD_COLORS } from '@/render/world/worldPalette'
import type { World } from '@/render/world/worldTypes'

const PATH_HEIGHT = 0.012
const BANK_HEIGHT = 0.008
const WATER_HEIGHT = 0.02
const BANK_EXTRA = 0.6
const CLIFF_DEPTH = 2.4

export function WorldTerrain({ world, withGround = true }: { world: World; withGround?: boolean }) {
  const paths = useMemo(() => world.paths.map((path) => ribbonGeometry(path.points, path.width)), [world])
  const bank = useMemo(() => (world.river ? ribbonGeometry(world.river.points, world.river.width + BANK_EXTRA) : null), [world])
  const water = useMemo(() => (world.river ? ribbonGeometry(world.river.points, world.river.width) : null), [world])
  const { ground } = world
  const width = ground.maxX - ground.minX
  const depth = ground.maxZ - ground.minZ
  const centerX = (ground.minX + ground.maxX) / 2
  const centerZ = (ground.minZ + ground.maxZ) / 2

  return (
    <group>
      {withGround && (
        <mesh position={[centerX, -0.05, centerZ]} receiveShadow>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color={WORLD_COLORS.grass} roughness={0.95} flatShading />
        </mesh>
      )}
      {world.island && (
        <>
          <mesh position={[centerX, -0.1 - CLIFF_DEPTH / 2, centerZ]}>
            <boxGeometry args={[width, CLIFF_DEPTH, depth]} />
            <meshStandardMaterial color={WORLD_COLORS.cliff} roughness={1} flatShading />
          </mesh>
          <mesh position={[centerX, -0.1 - CLIFF_DEPTH - 0.4, centerZ]} scale={[0.92, 1, 0.92]}>
            <boxGeometry args={[width, 0.8, depth]} />
            <meshStandardMaterial color={WORLD_COLORS.cliffDark} roughness={1} flatShading />
          </mesh>
        </>
      )}
      {paths.map((geometry, index) => (
        <mesh key={index} geometry={geometry} position={[0, PATH_HEIGHT, 0]} receiveShadow>
          <meshStandardMaterial color={WORLD_COLORS.path} roughness={1} side={DoubleSide} />
        </mesh>
      ))}
      {bank && (
        <mesh geometry={bank} position={[0, BANK_HEIGHT, 0]} receiveShadow>
          <meshStandardMaterial color={WORLD_COLORS.bank} roughness={1} side={DoubleSide} />
        </mesh>
      )}
      {water && (
        <mesh geometry={water} position={[0, WATER_HEIGHT, 0]}>
          <meshStandardMaterial color={WORLD_COLORS.water} roughness={0.25} metalness={0} side={DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
