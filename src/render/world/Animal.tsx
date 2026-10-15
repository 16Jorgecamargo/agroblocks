import { Suspense, useEffect, useRef, useState } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { animate, type AnimationPlaybackControls } from 'motion'
import type { Group } from 'three'
import { DURATIONS } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { modelEntry, modelUrl, type ModelEntry } from '@/render/models/manifest'
import { ModelBoundary, useClonedScene } from '@/render/models/Model'
import { createRandom, hashString } from '@/render/seededRandom'
import { closestAngle, headingTo, idleSeconds, nextTarget, SPECIES_GAIT, SPECIES_SPEED, walkSeconds, type AnimalPhase, type Course } from '@/render/world/animalBrain'
import type { AnimalSpawn } from '@/render/world/worldTypes'

export type Occupancy = Map<string, Course>

const FULL_TURN = Math.PI * 2
const HEADING_STEPS = 628

function AnimalBody({ entry, spawn, active, occupancy }: { entry: ModelEntry; spawn: AnimalSpawn; active: boolean; occupancy: Occupancy }) {
  const object = useClonedScene(entry)
  const { animations } = useGLTF(modelUrl(entry))
  const { actions } = useAnimations(animations, object)
  const group = useRef<Group>(null)
  const [phase, setPhase] = useState<AnimalPhase>('idle')
  const [initial] = useState(() => ({ x: spawn.x, z: spawn.z, yaw: ((hashString(spawn.id) % HEADING_STEPS) / HEADING_STEPS) * FULL_TURN }))

  useEffect(() => {
    const name = phase === 'walk' ? entry.clips?.move : entry.clips?.idle
    const action = name ? actions[name] : undefined
    if (!action) return
    action.reset().fadeIn(DURATIONS.clipFade).play()
    action.paused = !active
    return () => {
      action.fadeOut(DURATIONS.clipFade)
    }
  }, [phase, actions, entry, active])

  useEffect(() => {
    if (!active) {
      setPhase('idle')
      return
    }
    const random = createRandom(hashString(spawn.id))
    const speed = SPECIES_SPEED[spawn.species] * spawn.scale
    const grazes = SPECIES_GAIT[spawn.species] === 'graze'
    let cancelled = false
    let running: AnimationPlaybackControls[] = []
    const loop = async () => {
      while (!cancelled) {
        setPhase('idle')
        const rest = animate(0, 1, { duration: idleSeconds(random) })
        running = [rest]
        await rest
        const body = group.current
        if (cancelled || !body) return
        if (grazes) {
          const turn = animate(body.rotation, { y: body.rotation.y + (random() - 0.5) * Math.PI }, SPRINGS.snap)
          running = [turn]
          await turn
          continue
        }
        const from = { x: body.position.x, z: body.position.z }
        const others = [...occupancy.entries()].filter(([id]) => id !== spawn.id).map(([, point]) => point)
        const target = nextTarget(random, spawn.area, from, 1.2 * spawn.scale, others, spawn.scale)
        occupancy.set(spawn.id, { from, to: target })
        if (target === from) continue
        setPhase('walk')
        const turn = animate(body.rotation, { y: closestAngle(body.rotation.y, headingTo(from, target)) }, SPRINGS.snap)
        const walk = animate(body.position, { x: target.x, z: target.z }, { duration: walkSeconds(from, target, speed), ease: 'linear' })
        running = [turn, walk]
        await walk
        occupancy.set(spawn.id, { from: target, to: target })
      }
    }
    void loop()
    return () => {
      cancelled = true
      running.forEach((controls) => controls.stop())
      const body = group.current
      if (body) occupancy.set(spawn.id, { from: { x: body.position.x, z: body.position.z }, to: { x: body.position.x, z: body.position.z } })
    }
  }, [active, spawn, occupancy])

  useEffect(() => {
    occupancy.set(spawn.id, { from: { x: spawn.x, z: spawn.z }, to: { x: spawn.x, z: spawn.z } })
    return () => {
      occupancy.delete(spawn.id)
    }
  }, [occupancy, spawn])

  return (
    <group ref={group} position={[initial.x, 0, initial.z]} rotation={[0, initial.yaw, 0]} scale={spawn.scale}>
      <primitive object={object} scale={entry.scale} position={[0, entry.yOffset, 0]} rotation={[0, entry.rotationY, 0]} />
    </group>
  )
}

export function Animal({ spawn, active, occupancy }: { spawn: AnimalSpawn; active: boolean; occupancy: Occupancy }) {
  const entry = modelEntry(spawn.species)
  if (!entry) return null
  return (
    <ModelBoundary fallback={null}>
      <Suspense fallback={null}>
        <AnimalBody entry={entry} spawn={spawn} active={active} occupancy={occupancy} />
      </Suspense>
    </ModelBoundary>
  )
}
