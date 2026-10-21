import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Euler, Matrix4, Quaternion, Vector3, type BufferGeometry, type InstancedMesh } from 'three'
import { hashString } from '@/render/seededRandom'
import { armGeometry, DRIVER_SEAT, hatGeometry, headGeometry, legGeometry, skinTones, TASK_TOOL, toolGeometry, torsoGeometry, tractorBodyGeometry, TRACTOR_WHEELS, wheelGeometry, type ToolKind } from '@/render/world/actors/actorGeometry'
import { actorPose, type ActorPose } from '@/render/world/actors/actorMotion'
import { armMatrices, bodyMatrix, handMatrix, hoeMatrix, legMatrices, limbs } from '@/render/world/actors/workerPose'
import type { Actor, ActorTask } from '@/render/world/worldTypes'

const TOOL_KINDS: ToolKind[] = ['hoe', 'can', 'basket', 'bucket', 'crate']
const LEFT_HANDED: ReadonlySet<ToolKind> = new Set<ToolKind>(['basket', 'bucket'])
const CRATE_AT = new Matrix4().makeTranslation(0, 0.6, 0.26)
const SEAT = new Matrix4().makeTranslation(DRIVER_SEAT.x, DRIVER_SEAT.y, DRIVER_SEAT.z)

interface Person {
  actor: Actor
  task: ActorTask
  tool: ToolKind | null
  skin: string
}

function Instanced({ geometry, count, meshRef, shadows }: { geometry: BufferGeometry; count: number; meshRef: (mesh: InstancedMesh | null) => void; shadows: boolean }) {
  if (count === 0) return null
  return (
    <instancedMesh key={count} ref={meshRef} args={[geometry, undefined, count]} castShadow={shadows} receiveShadow frustumCulled={false}>
      <meshStandardMaterial vertexColors flatShading roughness={0.85} />
    </instancedMesh>
  )
}

export function Actors({ actors, active, shadows = true }: { actors: Actor[]; active: boolean; shadows?: boolean }) {
  const geometries = useMemo(
    () => ({
      leg: legGeometry(),
      arm: armGeometry(),
      torso: torsoGeometry(),
      head: headGeometry(),
      hat: hatGeometry(),
      tractor: tractorBodyGeometry(),
      wheel: wheelGeometry(),
      tools: Object.fromEntries(TOOL_KINDS.map((kind) => [kind, toolGeometry(kind)])) as Record<ToolKind, BufferGeometry>,
    }),
    [],
  )
  const tractors = useMemo(() => actors.filter((actor) => actor.kind === 'tractor'), [actors])
  const people = useMemo<Person[]>(() => {
    const tones = skinTones()
    return actors.map((actor) => {
      const task: ActorTask = actor.kind === 'tractor' ? 'drive' : actor.task
      return { actor, task, tool: TASK_TOOL[task] ?? null, skin: tones[hashString(actor.id) % tones.length] }
    })
  }, [actors])
  const toolCounts = useMemo(() => Object.fromEntries(TOOL_KINDS.map((kind) => [kind, people.filter((person) => person.tool === kind).length])) as Record<ToolKind, number>, [people])
  const meshes = useRef<Record<string, InstancedMesh | null>>({})
  const lastTime = useRef(0)
  const bind = (name: string) => (mesh: InstancedMesh | null) => {
    meshes.current[name] = mesh
  }

  const place = (time: number) => {
    lastTime.current = time
    const { leg, arm, torso, head, hat, tractor, wheel } = meshes.current
    const toolIndex: Record<ToolKind, number> = { hoe: 0, can: 0, basket: 0, bucket: 0, crate: 0 }
    const tractorPose = new Map<string, { pose: ActorPose; matrix: Matrix4 }>()
    tractors.forEach((actor, index) => {
      const pose = actorPose(actor, time)
      const matrix = bodyMatrix(pose, 0)
      tractorPose.set(actor.id, { pose, matrix })
      tractor?.setMatrixAt(index, matrix)
      TRACTOR_WHEELS.forEach((spot, wheelIndex) => {
        const spin = new Matrix4().compose(new Vector3(spot.x, spot.radius, spot.z), new Quaternion().setFromEuler(new Euler(pose.travelled / spot.radius, 0, 0)), new Vector3(spot.width, spot.radius, spot.radius))
        wheel?.setMatrixAt(index * TRACTOR_WHEELS.length + wheelIndex, matrix.clone().multiply(spin))
      })
    })
    people.forEach((person, index) => {
      const driven = tractorPose.get(person.actor.id)
      const pose = driven ? { ...driven.pose, x: 0, z: 0, heading: 0, moving: false } : actorPose(person.actor, time)
      const motion = limbs(person.task, pose)
      const body = driven ? driven.matrix.clone().multiply(SEAT) : bodyMatrix(pose, motion.bob + (person.actor.y ?? 0))
      const legs = legMatrices(body, motion)
      const arms = armMatrices(body, motion)
      leg?.setMatrixAt(index * 2, legs[0])
      leg?.setMatrixAt(index * 2 + 1, legs[1])
      arm?.setMatrixAt(index * 2, arms[0])
      arm?.setMatrixAt(index * 2 + 1, arms[1])
      torso?.setMatrixAt(index, body)
      head?.setMatrixAt(index, body)
      hat?.setMatrixAt(index, body)
      if (person.tool) {
        const matrix = person.tool === 'crate' ? body.clone().multiply(CRATE_AT) : person.tool === 'hoe' ? hoeMatrix(body, motion) : handMatrix(arms[LEFT_HANDED.has(person.tool) ? 0 : 1])
        meshes.current[`tool-${person.tool}`]?.setMatrixAt(toolIndex[person.tool], matrix)
        toolIndex[person.tool] += 1
      }
    })
    for (const mesh of Object.values(meshes.current)) if (mesh) mesh.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    const { arm, torso, head } = meshes.current
    const tint = new Color()
    people.forEach((person, index) => {
      tint.set(person.actor.tint)
      torso?.setColorAt(index, tint)
      arm?.setColorAt(index * 2, tint)
      arm?.setColorAt(index * 2 + 1, tint)
      head?.setColorAt(index, tint.set(person.skin))
    })
    for (const mesh of [arm, torso, head]) if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true
    place(lastTime.current)
  })

  useFrame(({ clock }) => {
    if (active) place(clock.elapsedTime)
  })

  if (actors.length === 0) return null
  return (
    <group>
      <Instanced geometry={geometries.leg} count={people.length * 2} meshRef={bind('leg')} shadows={shadows} />
      <Instanced geometry={geometries.arm} count={people.length * 2} meshRef={bind('arm')} shadows={shadows} />
      <Instanced geometry={geometries.torso} count={people.length} meshRef={bind('torso')} shadows={shadows} />
      <Instanced geometry={geometries.head} count={people.length} meshRef={bind('head')} shadows={shadows} />
      <Instanced geometry={geometries.hat} count={people.length} meshRef={bind('hat')} shadows={shadows} />
      {TOOL_KINDS.map((kind) => (
        <Instanced key={kind} geometry={geometries.tools[kind]} count={toolCounts[kind]} meshRef={bind(`tool-${kind}`)} shadows={shadows} />
      ))}
      <Instanced geometry={geometries.tractor} count={tractors.length} meshRef={bind('tractor')} shadows={shadows} />
      <Instanced geometry={geometries.wheel} count={tractors.length * TRACTOR_WHEELS.length} meshRef={bind('wheel')} shadows={shadows} />
    </group>
  )
}
