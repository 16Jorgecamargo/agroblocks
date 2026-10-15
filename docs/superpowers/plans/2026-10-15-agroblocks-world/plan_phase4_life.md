# AgroBlocks World — Fase 4: Vida — animais, borboletas, vitórias-régias

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animais que pastam e passeiam dentro do pasto, borboletas voando em laços e vitórias-régias balançando, tudo com Motion e desligado em movimento reduzido/gráficos leves.

**Architecture:** Cérebro puro (`animalBrain.ts`) decide alvo, rumo e tempos; `Animal.tsx` executa com `animate()` em posição/rotação e troca clipes pelo mixer do drei. `Butterflies.tsx` e `LilyPads.tsx` usam keyframes puros testados.

**Spec:** seções 5, 5b · Leia `plan_index.md` antes.

---

### Task 4.1: Cérebro dos animais

**Files:**
- Create: `src/render/world/animalBrain.ts`
- Test: `src/render/world/animalBrain.test.ts`

**Interfaces:**
- Consumes: `Vec2`, `AnimalSpecies`, `pointInPolygon`, `polygonBounds`, `DURATIONS.animalIdleMin/animalIdleMax/animalStepMin`.
- Produces: `type AnimalPhase = 'idle' | 'walk'`; `SPECIES_SPEED: Record<AnimalSpecies, number>`; `idleSeconds(random)`, `walkSeconds(from, to, speed)`, `nextTarget(random, area, from, minStep = 1.2)`, `headingTo(from, to)`, `closestAngle(current, target)`.

- [ ] **Step 1: Teste que falha `src/render/world/animalBrain.test.ts`**

```ts
import { DURATIONS } from '@/motion/presets'
import { createRandom } from '@/render/seededRandom'
import { closestAngle, headingTo, idleSeconds, nextTarget, walkSeconds } from '@/render/world/animalBrain'
import { pointInPolygon, rectPolygon } from '@/render/world/geometry'

const pasture = rectPolygon({ minX: 0, maxX: 6, minZ: 0, maxZ: 4 })

describe('animalBrain', () => {
  it('always picks targets inside the pasture and at least a step away', () => {
    const random = createRandom(7)
    let from = { x: 3, z: 2 }
    for (let index = 0; index < 50; index += 1) {
      const target = nextTarget(random, pasture, from)
      expect(pointInPolygon(target, pasture)).toBe(true)
      expect(Math.hypot(target.x - from.x, target.z - from.z)).toBeGreaterThanOrEqual(1.2)
      from = target
    }
  })

  it('stays put when the pasture is too small to move', () => {
    const tiny = rectPolygon({ minX: 0, maxX: 0.5, minZ: 0, maxZ: 0.5 })
    expect(nextTarget(createRandom(1), tiny, { x: 0.25, z: 0.25 })).toEqual({ x: 0.25, z: 0.25 })
  })

  it('rests between the idle limits', () => {
    const random = createRandom(3)
    for (let index = 0; index < 20; index += 1) {
      const seconds = idleSeconds(random)
      expect(seconds).toBeGreaterThanOrEqual(DURATIONS.animalIdleMin)
      expect(seconds).toBeLessThanOrEqual(DURATIONS.animalIdleMax)
    }
  })

  it('walks at the species speed with a minimum step time', () => {
    expect(walkSeconds({ x: 0, z: 0 }, { x: 3, z: 4 }, 1)).toBe(5)
    expect(walkSeconds({ x: 0, z: 0 }, { x: 0, z: 0.01 }, 1)).toBe(DURATIONS.animalStepMin)
  })

  it('faces the target and turns the short way', () => {
    expect(headingTo({ x: 0, z: 0 }, { x: 0, z: 1 })).toBeCloseTo(0)
    expect(headingTo({ x: 0, z: 0 }, { x: 1, z: 0 })).toBeCloseTo(Math.PI / 2)
    expect(closestAngle(3, -3)).toBeCloseTo(-3 + Math.PI * 2)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/world/animalBrain.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: `src/render/world/animalBrain.ts`**

```ts
import { DURATIONS } from '@/motion/presets'
import { pointInPolygon, polygonBounds } from '@/render/world/geometry'
import type { AnimalSpecies, Vec2 } from '@/render/world/worldTypes'

export type AnimalPhase = 'idle' | 'walk'

export const SPECIES_SPEED: Record<AnimalSpecies, number> = {
  cow: 0.6,
  horse: 1.1,
  pig: 0.7,
  sheep: 0.8,
  llama: 0.8,
  pug: 1.2,
}

const TARGET_TRIES = 40

export function idleSeconds(random: () => number): number {
  return DURATIONS.animalIdleMin + random() * (DURATIONS.animalIdleMax - DURATIONS.animalIdleMin)
}

export function walkSeconds(from: Vec2, to: Vec2, speed: number): number {
  return Math.max(DURATIONS.animalStepMin, Math.hypot(to.x - from.x, to.z - from.z) / speed)
}

export function nextTarget(random: () => number, area: Vec2[], from: Vec2, minStep = 1.2): Vec2 {
  const bounds = polygonBounds(area)
  for (let tries = 0; tries < TARGET_TRIES; tries += 1) {
    const candidate = { x: bounds.minX + random() * (bounds.maxX - bounds.minX), z: bounds.minZ + random() * (bounds.maxZ - bounds.minZ) }
    if (pointInPolygon(candidate, area) && Math.hypot(candidate.x - from.x, candidate.z - from.z) >= minStep) return candidate
  }
  return from
}

export function headingTo(from: Vec2, to: Vec2): number {
  return Math.atan2(to.x - from.x, to.z - from.z)
}

export function closestAngle(current: number, target: number): number {
  let difference = (target - current) % (Math.PI * 2)
  if (difference > Math.PI) difference -= Math.PI * 2
  if (difference < -Math.PI) difference += Math.PI * 2
  return current + difference
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/render/world/animalBrain.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/world/animalBrain.ts src/render/world/animalBrain.test.ts
git commit -m "feat(world): add animal wandering brain"
```

---

### Task 4.2: `Animal` e `Herd`

**Files:**
- Create: `src/render/world/Animal.tsx`, `src/render/world/Herd.tsx`
- Modify: `src/render/farm3d/FarmScene.tsx`

**Interfaces:**
- Consumes: Task 4.1, `modelEntry`, `modelUrl`, `ModelBoundary`, `useClonedScene`, `createRandom`, `hashString`, `SPRINGS.snap`, `DURATIONS.clipFade`.
- Produces: `Animal({ spawn, active })`, `Herd({ animals, active })`.

- [ ] **Step 1: Linha de base**

Componente R3F sem teste unitário possível neste projeto (não há renderizador de testes do R3F); a lógica está no cérebro (Task 4.1). Rodar a suíte de render antes:
Run: `npx vitest run src/render --maxWorkers=2`
Expected: PASS.

- [ ] **Step 2: `src/render/world/Animal.tsx`**

```tsx
import { Suspense, useEffect, useRef, useState } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { animate, type AnimationPlaybackControls } from 'motion'
import type { Group } from 'three'
import { DURATIONS } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { modelEntry, modelUrl, type ModelEntry } from '@/render/models/manifest'
import { ModelBoundary, useClonedScene } from '@/render/models/Model'
import { createRandom, hashString } from '@/render/seededRandom'
import { closestAngle, headingTo, idleSeconds, nextTarget, SPECIES_SPEED, walkSeconds, type AnimalPhase } from '@/render/world/animalBrain'
import type { AnimalSpawn } from '@/render/world/worldTypes'

const FULL_TURN = Math.PI * 2
const HEADING_STEPS = 628

function AnimalBody({ entry, spawn, active }: { entry: ModelEntry; spawn: AnimalSpawn; active: boolean }) {
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
    const speed = SPECIES_SPEED[spawn.species]
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
        const from = { x: body.position.x, z: body.position.z }
        const target = nextTarget(random, spawn.area, from)
        setPhase('walk')
        const turn = animate(body.rotation, { y: closestAngle(body.rotation.y, headingTo(from, target)) }, SPRINGS.snap)
        const walk = animate(body.position, { x: target.x, z: target.z }, { duration: walkSeconds(from, target, speed), ease: 'linear' })
        running = [turn, walk]
        await walk
      }
    }
    void loop()
    return () => {
      cancelled = true
      running.forEach((controls) => controls.stop())
    }
  }, [active, spawn])

  return (
    <group ref={group} position={[initial.x, 0, initial.z]} rotation={[0, initial.yaw, 0]}>
      <primitive object={object} scale={entry.scale} position={[0, entry.yOffset, 0]} rotation={[0, entry.rotationY, 0]} />
    </group>
  )
}

export function Animal({ spawn, active }: { spawn: AnimalSpawn; active: boolean }) {
  const entry = modelEntry(spawn.species)
  if (!entry) return null
  return (
    <ModelBoundary fallback={null}>
      <Suspense fallback={null}>
        <AnimalBody entry={entry} spawn={spawn} active={active} />
      </Suspense>
    </ModelBoundary>
  )
}
```

- [ ] **Step 3: `src/render/world/Herd.tsx`**

```tsx
import { Animal } from '@/render/world/Animal'
import type { AnimalSpawn } from '@/render/world/worldTypes'

export function Herd({ animals, active }: { animals: AnimalSpawn[]; active: boolean }) {
  return (
    <group>
      {animals.map((spawn) => (
        <Animal key={spawn.id} spawn={spawn} active={active} />
      ))}
    </group>
  )
}
```

- [ ] **Step 4: Ligar na fazenda**

Em `src/render/farm3d/FarmScene.tsx`, importar `Herd` e, depois de `<WorldProps … />`, acrescentar `<Herd animals={world.animals} active={!reducedMotion && !lowGraphics} />`.

- [ ] **Step 5: Rodar**

Run: `npm run typecheck && npx vitest run src/render src/motion --maxWorkers=2`
Expected: PASS (inclui `noLooseDurations`).

- [ ] **Step 6: Verificação visual**

Dev server + Playwright MCP em `#/jogar/m1-first-harvest`: animais aparecem no pasto à esquerda, andam de frente (cabeça na direção do movimento), param e voltam a andar; porcos/ovelhas/lhama/cachorro andam com pulinhos (clipe `Jump`). Se andarem de lado ou de costas, ajuste `rotationY` desses animais em `scripts/assets/assets.config.json` (π/2, −π/2 ou π), rode `npm run assets:build` e registre no ledger. Em Configurações › "Reduzir animações", animais param. Fechar o navegador ao terminar.

- [ ] **Step 7: Commit**

```bash
git add src/render scripts/assets public/models src/render/models/manifest.generated.json
git commit -m "feat(world): animals wander and graze in the pasture"
```

---

### Task 4.3: Borboletas e vitórias-régias

**Files:**
- Create: `src/render/world/ambientLoops.ts`, `src/render/world/Butterflies.tsx`, `src/render/world/LilyPads.tsx`
- Modify: `src/render/world/WorldProps.tsx`, `src/render/farm3d/FarmScene.tsx`
- Test: `src/render/world/ambientLoops.test.ts`

**Interfaces:**
- Produces: `butterflyPath(center: Vec2, seed: number): { x: number[]; y: number[]; z: number[] }` (laço fechado); `Butterflies({ points, active })`; `LilyPads({ lilies, active })`.

- [ ] **Step 1: Teste que falha `src/render/world/ambientLoops.test.ts`**

```ts
import { butterflyPath } from '@/render/world/ambientLoops'

describe('butterflyPath', () => {
  it('loops around its center and closes where it started', () => {
    const path = butterflyPath({ x: 2, z: -1 }, 3)
    expect(path.x.length).toBe(path.z.length)
    expect(path.x[0]).toBeCloseTo(path.x[path.x.length - 1])
    expect(path.z[0]).toBeCloseTo(path.z[path.z.length - 1])
    for (let index = 0; index < path.x.length; index += 1) {
      expect(Math.hypot(path.x[index] - 2, path.z[index] + 1)).toBeLessThanOrEqual(1.01)
      expect(path.y[index]).toBeGreaterThanOrEqual(0.5)
    }
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/world/ambientLoops.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: `src/render/world/ambientLoops.ts`**

```ts
import type { Vec2 } from '@/render/world/worldTypes'

const LOOP_POINTS = 9
const LOOP_RADIUS = 0.9
const BASE_HEIGHT = 0.6
const HEIGHT_SWING = 0.45

export function butterflyPath(center: Vec2, seed: number): { x: number[]; y: number[]; z: number[] } {
  const x: number[] = []
  const y: number[] = []
  const z: number[] = []
  for (let index = 0; index <= LOOP_POINTS; index += 1) {
    const angle = (index / LOOP_POINTS) * Math.PI * 2 + seed
    const wobble = 0.7 + 0.3 * Math.sin(angle * 2 + seed)
    x.push(center.x + Math.cos(angle) * LOOP_RADIUS * wobble)
    z.push(center.z + Math.sin(angle) * LOOP_RADIUS * wobble)
    y.push(BASE_HEIGHT + HEIGHT_SWING * (0.5 + 0.5 * Math.sin(angle * 3 + seed)))
  }
  return { x, y, z }
}
```

- [ ] **Step 4: `src/render/world/Butterflies.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { animate } from 'motion'
import { DoubleSide, type Group, type Mesh } from 'three'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { butterflyPath } from '@/render/world/ambientLoops'
import type { Vec2 } from '@/render/world/worldTypes'

const WING_COLORS = ['#fff6d6', '#ffd23f', '#ff9f43', '#9ad0ff', '#ffffff'] as const

function Butterfly({ center, index }: { center: Vec2; index: number }) {
  const body = useRef<Group>(null)
  const left = useRef<Mesh>(null)
  const right = useRef<Mesh>(null)
  useEffect(() => {
    const group = body.current
    if (!group || !left.current || !right.current) return
    const path = butterflyPath(center, index * 1.7)
    const flight = animate(group.position, path, { duration: DURATIONS.butterflyLoop, repeat: Infinity, ease: EASINGS.easeInOutSine })
    const leftFlap = animate(left.current.rotation, { z: [0.2, 1.2, 0.2] }, { duration: DURATIONS.wingFlap, repeat: Infinity })
    const rightFlap = animate(right.current.rotation, { z: [-0.2, -1.2, -0.2] }, { duration: DURATIONS.wingFlap, repeat: Infinity })
    return () => {
      flight.stop()
      leftFlap.stop()
      rightFlap.stop()
    }
  }, [center, index])
  const color = WING_COLORS[index % WING_COLORS.length]
  return (
    <group ref={body} position={[center.x, 0.8, center.z]} scale={0.6}>
      <mesh ref={left} position={[-0.06, 0, 0]}>
        <planeGeometry args={[0.12, 0.1]} />
        <meshStandardMaterial color={color} side={DoubleSide} />
      </mesh>
      <mesh ref={right} position={[0.06, 0, 0]}>
        <planeGeometry args={[0.12, 0.1]} />
        <meshStandardMaterial color={color} side={DoubleSide} />
      </mesh>
    </group>
  )
}

export function Butterflies({ points, active }: { points: Vec2[]; active: boolean }) {
  if (!active) return null
  return (
    <group>
      {points.map((point, index) => (
        <Butterfly key={index} center={point} index={index} />
      ))}
    </group>
  )
}
```

- [ ] **Step 5: `src/render/world/LilyPads.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { animate } from 'motion'
import type { Group } from 'three'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { InstancedModel } from '@/render/world/InstancedModel'
import type { PropItem } from '@/render/world/worldTypes'

const WATER_LEVEL = 0.03
const BOB = 0.025

function BobbingLilies({ lilies }: { lilies: PropItem[] }) {
  const group = useRef<Group>(null)
  useEffect(() => {
    const target = group.current
    if (!target) return
    const controls = animate(target.position, { y: [WATER_LEVEL, WATER_LEVEL + BOB, WATER_LEVEL] }, { duration: DURATIONS.lilyBob, repeat: Infinity, ease: EASINGS.easeInOutSine })
    return () => controls.stop()
  }, [])
  return (
    <group ref={group} position={[0, WATER_LEVEL, 0]}>
      <InstancedModel id="lily" props={lilies} shadows={false} />
    </group>
  )
}

export function LilyPads({ lilies, active }: { lilies: PropItem[]; active: boolean }) {
  if (lilies.length === 0) return null
  if (!active) {
    return (
      <group position={[0, WATER_LEVEL, 0]}>
        <InstancedModel id="lily" props={lilies} shadows={false} />
      </group>
    )
  }
  return <BobbingLilies lilies={lilies} />
}
```

- [ ] **Step 6: Ligar**

Em `src/render/world/WorldProps.tsx`: importar `LilyPads`; calcular `const lilies = useMemo(() => world.props.filter((prop) => prop.model === 'lily'), [world])`; renderizar `<LilyPads lilies={lilies} active={ambient} />` dentro do `<group>`.
Em `src/render/farm3d/FarmScene.tsx`: importar `Butterflies` e acrescentar `<Butterflies points={world.butterflies} active={!reducedMotion && !lowGraphics} />` após `<Herd … />`.

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/render src/motion --maxWorkers=2 && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/render
git commit -m "feat(world): add butterflies and bobbing lily pads"
```
