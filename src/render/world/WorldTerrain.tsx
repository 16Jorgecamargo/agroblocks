import { useMemo } from 'react'
import { DoubleSide } from 'three'
import { groundDetail } from '@/render/world/groundDetail'
import { ribbonGeometry } from '@/render/world/ribbon'
import { WORLD_COLORS } from '@/render/world/worldPalette'
import type { World } from '@/render/world/worldTypes'

const PATH_HEIGHT = 0.04
const PATCH_HEIGHT = 0.006
const BANK_HEIGHT = 0.008
const WATER_HEIGHT = 0.02
const BANK_EXTRA = 0.6
const CLIFF_DEPTH = 2.4

export function WorldTerrain({ world, withGround = true }: { world: World; withGround?: boolean }) {
  const paths = useMemo(() => world.paths.map((path) => ribbonGeometry(path.points, path.width)), [world])
  const bank = useMemo(() => (world.river ? ribbonGeometry(world.river.points, world.river.width + BANK_EXTRA) : null), [world])
  const water = useMemo(() => (world.river ? ribbonGeometry(world.river.points, world.river.width) : null), [world])
  const detail = useMemo(() => groundDetail(world), [world])
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
          <meshStandardMaterial color={world.palette.grass} roughness={0.95} flatShading />
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
      {(world.patches ?? []).map((patch, index) => {
        const lift = patch.height ?? 0
        const thickness = lift > 0 ? lift : 0.02
        return (
          <mesh
            key={`patch-${index}`}
            position={[(patch.rect.minX + patch.rect.maxX) / 2, lift > 0 ? lift / 2 : PATCH_HEIGHT, (patch.rect.minZ + patch.rect.maxZ) / 2]}
            castShadow={lift > 0}
            receiveShadow
          >
            <boxGeometry args={[patch.rect.maxX - patch.rect.minX, thickness, patch.rect.maxZ - patch.rect.minZ]} />
            <meshStandardMaterial color={patch.color} roughness={1} flatShading />
          </mesh>
        )
      })}
      {(world.mounds ?? []).map((mound, index) => (
        <mesh key={`mound-${index}`} position={[mound.x, 0, mound.z]} scale={[1, mound.height / mound.radius, 1]} receiveShadow>
          <sphereGeometry args={[mound.radius, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={world.palette.grassDeep} roughness={1} flatShading />
        </mesh>
      ))}
      {paths.map((geometry, index) => (
        <mesh key={index} geometry={geometry} position={[0, PATH_HEIGHT, 0]} receiveShadow>
          <meshStandardMaterial color={world.palette.path} roughness={1} side={DoubleSide} />
        </mesh>
      ))}
      {detail.texture && (
        <mesh geometry={detail.texture} receiveShadow>
          <meshStandardMaterial vertexColors roughness={1} flatShading />
        </mesh>
      )}
      {detail.stains && (
        <mesh geometry={detail.stains} receiveShadow>
          <meshStandardMaterial vertexColors roughness={1} side={DoubleSide} />
        </mesh>
      )}
      {detail.ruts && (
        <mesh geometry={detail.ruts} position={[0, PATH_HEIGHT + 0.006, 0]} receiveShadow>
          <meshStandardMaterial vertexColors roughness={1} side={DoubleSide} />
        </mesh>
      )}
      {detail.bank && (
        <mesh geometry={detail.bank} receiveShadow>
          <meshStandardMaterial vertexColors roughness={1} side={DoubleSide} />
        </mesh>
      )}
      {detail.water && (
        <mesh geometry={detail.water}>
          <meshStandardMaterial vertexColors roughness={0.25} metalness={0} side={DoubleSide} />
        </mesh>
      )}
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
