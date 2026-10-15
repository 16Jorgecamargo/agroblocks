# AgroBlocks Motion — Fase 6: Cena 3D com modelos CC0 e animação via Motion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar primitivas por GLB (plantas em 5 estágios, árvores, pedras, cercas, robô animado recolorido) com fallback procedural, e animar robô, plantas, efeitos, câmera e ambiente com `animate()` do Motion; fallback 2D com transições Motion.

**Architecture:** `src/render/models/` resolve qual modelo usar (funções puras) e carrega GLB com `useGLTF` + error boundary + Suspense, caindo para os componentes procedurais existentes. Animações 3D usam `animate(objeto.position | rotation | scale, …)` e `useMotionValue` lidos em `useFrame`. A velocidade do jogo escala as molas (`scaleSpring`).

**Tech Stack:** three, @react-three/fiber, @react-three/drei (`useGLTF`, `useAnimations`), `three/examples/jsm/utils/SkeletonUtils.js`, `motion`.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-motion-assets-design.md` (seção 5)

Leia `plan_index.md` antes de começar.

---

### Task 6.1: Escolha de modelos, componente `Model` e carregamento

**Files:**
- Create: `src/render/models/modelChoice.ts`, `src/render/models/Model.tsx`, `src/render/SceneLoading.tsx`
- Modify: `src/features/mission-select/MissionSelectPage.tsx` (pré-carregar), `src/render/FarmView.css`
- Test: `src/render/models/modelChoice.test.ts`, `src/render/SceneLoading.test.tsx`

**Interfaces:**
- Consumes: `ModelId`, `MODEL_MANIFEST`, `modelEntry`, `modelUrl`, `PlotState`, `DecorationKind`.
- Produces:
  - `cropStageFor(plot: PlotState, growth: number, growTicks: number): 1 | 2 | 3 | 4 | 5 | null`
  - `cropModelId(stage: 1 | 2 | 3 | 4 | 5): ModelId`
  - `decorationModelId(kind: DecorationKind, variant: number): ModelId`
  - `type RobotClip = 'idle' | 'move' | 'success' | 'error'`, `robotClipFor(input: { moving: boolean; failed: boolean; celebrating: boolean }): RobotClip`
  - `ModelBoundary` (error boundary), `Model({ id, fallback })`, `preloadModels(): void`
  - `SceneLoading()` — `role="status"`, shimmer + pontos saltitantes

- [ ] **Step 1: Escrever testes que falham**

`src/render/models/modelChoice.test.ts`:
```ts
import { cropModelId, cropStageFor, decorationModelId, robotClipFor } from '@/render/models/modelChoice'

describe('modelChoice', () => {
  it('maps plot states and growth to the five crop stages', () => {
    expect(cropStageFor('untilled', 0, 4)).toBeNull()
    expect(cropStageFor('tilled', 0, 4)).toBeNull()
    expect(cropStageFor('harvested', 0, 4)).toBeNull()
    expect(cropStageFor('seeded', 0, 4)).toBe(1)
    expect(cropStageFor('seeded', 2, 4)).toBe(2)
    expect(cropStageFor('growing', 1, 4)).toBe(3)
    expect(cropStageFor('growing', 3, 4)).toBe(4)
    expect(cropStageFor('mature', 0, 4)).toBe(5)
    expect(cropModelId(5)).toBe('crop-5')
  })

  it('picks decoration models by kind and variant', () => {
    expect(decorationModelId('tree', 0)).toBe('tree-a')
    expect(decorationModelId('tree', 4)).toBe('tree-b')
    expect(decorationModelId('pine', 2)).toBe('pine')
    expect(decorationModelId('rock', 1)).toBe('rock-b')
    expect(decorationModelId('fence', 0)).toBe('fence')
    expect(decorationModelId('barn', 0)).toBe('barn')
  })

  it('chooses the robot clip by priority', () => {
    expect(robotClipFor({ moving: true, failed: true, celebrating: true })).toBe('error')
    expect(robotClipFor({ moving: true, failed: false, celebrating: true })).toBe('success')
    expect(robotClipFor({ moving: true, failed: false, celebrating: false })).toBe('move')
    expect(robotClipFor({ moving: false, failed: false, celebrating: false })).toBe('idle')
  })
})
```

`src/render/SceneLoading.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { SceneLoading } from '@/render/SceneLoading'

describe('SceneLoading', () => {
  it('announces loading', () => {
    render(<SceneLoading />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando fazenda')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/models/modelChoice.test.ts src/render/SceneLoading.test.tsx`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/render/models/modelChoice.ts`**

```ts
import type { ModelId } from '@/render/models/manifest'
import type { DecorationKind } from '@/render/sceneLayout'
import type { PlotState } from '@/game/world/types'

export type CropStage = 1 | 2 | 3 | 4 | 5

export function cropStageFor(plot: PlotState, growth: number, growTicks: number): CropStage | null {
  const late = growth * 2 >= growTicks
  if (plot === 'seeded') return late ? 2 : 1
  if (plot === 'growing') return late ? 4 : 3
  if (plot === 'mature') return 5
  return null
}

export function cropModelId(stage: CropStage): ModelId {
  return `crop-${stage}` as ModelId
}

const TREES: ModelId[] = ['tree-a', 'tree-b', 'tree-c']

export function decorationModelId(kind: DecorationKind, variant: number): ModelId {
  switch (kind) {
    case 'tree':
      return TREES[variant % TREES.length]
    case 'pine':
      return 'pine'
    case 'rock':
      return variant % 2 === 0 ? 'rock-a' : 'rock-b'
    case 'bush':
      return 'bush'
    case 'fence':
      return 'fence'
    case 'barn':
      return 'barn'
    case 'windmill':
      return 'windmill'
    case 'silo':
      return 'silo'
  }
}

export type RobotClip = 'idle' | 'move' | 'success' | 'error'

export function robotClipFor({ moving, failed, celebrating }: { moving: boolean; failed: boolean; celebrating: boolean }): RobotClip {
  if (failed) return 'error'
  if (celebrating) return 'success'
  if (moving) return 'move'
  return 'idle'
}
```

- [ ] **Step 4: Implementar `src/render/models/Model.tsx`**

```tsx
import { Component, Suspense, useMemo, type ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import type { Mesh, Object3D } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { MODEL_MANIFEST, modelEntry, modelUrl, type ModelEntry, type ModelId } from '@/render/models/manifest'

interface BoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

export class ModelBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function useClonedScene(entry: ModelEntry): Object3D {
  const { scene } = useGLTF(modelUrl(entry))
  return useMemo(() => {
    const copy = clone(scene)
    copy.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    return copy
  }, [scene])
}

function GltfModel({ entry }: { entry: ModelEntry }) {
  const object = useClonedScene(entry)
  return <primitive object={object} scale={entry.scale} position={[0, entry.yOffset, 0]} rotation={[0, entry.rotationY, 0]} />
}

export function Model({ id, fallback }: { id: ModelId; fallback: ReactNode }) {
  const entry = modelEntry(id)
  if (!entry) return <>{fallback}</>
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GltfModel entry={entry} />
      </Suspense>
    </ModelBoundary>
  )
}

export function preloadModels(): void {
  for (const entry of MODEL_MANIFEST) useGLTF.preload(modelUrl(entry))
}
```

- [ ] **Step 5: Implementar `src/render/SceneLoading.tsx`**

```tsx
import { motion } from 'motion/react'
import { EASINGS } from '@/motion/easings'

export function SceneLoading() {
  return (
    <div className="scene-loading" role="status">
      <motion.div
        className="scene-loading__shimmer"
        aria-hidden="true"
        animate={{ backgroundPositionX: ['-200%', '200%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
      <span className="scene-loading__dots" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span key={index} animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.12, ease: EASINGS.easeOutQuart }} />
        ))}
      </span>
      <span>Carregando fazenda…</span>
    </div>
  )
}
```

Em `src/render/FarmView.css`, acrescentar:
```css
.scene-loading {
  position: relative;
  display: grid;
  place-items: center;
  align-content: center;
  gap: var(--space-3);
  height: 100%;
  min-height: 320px;
  color: var(--green-900);
  font-weight: 700;
  background: #a8d8ea;
  overflow: hidden;
}

.scene-loading__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 30%, rgb(255 255 255 / 0.45) 50%, transparent 70%);
  background-size: 200% 100%;
}

.scene-loading__dots {
  display: flex;
  gap: 6px;
}

.scene-loading__dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--green-600);
}
```

- [ ] **Step 6: Pré-carregar no mapa**

Em `src/features/mission-select/MissionSelectPage.tsx`: importar `preloadModels` de `@/render/models/Model` e, dentro do componente, `useEffect(() => { if (renderMode !== '2d' && webgl) preloadModels() }, [renderMode, webgl])`.

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/render src/features/mission-select && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(render): add model selection, GLB model component with fallback and loading state"
```

---

### Task 6.2: Plantas, cenário e efeitos com modelos e Motion

**Files:**
- Create: `src/render/farm3d/motion3d.tsx`
- Modify (substituir): `src/render/farm3d/PlotTile.tsx`, `src/render/farm3d/Decorations.tsx`, `src/render/farm3d/Effects.tsx`

**Interfaces:**
- Consumes: Task 6.1, `PlantModel`, `PALETTE`, `Flat`, `SPRINGS`, `EASINGS`.
- Produces:
  - `SpringIn({ enabled, children })` — grupo que entra de escala 0,2 → 1 com mola `bounce`
  - `Sway({ enabled, seed, children })` — balanço contínuo leve
  - `PlotTile({ cell, position, isGoal, reducedMotion, growTicks })`
  - `Decorations({ items, animate })`, mantendo exports `Tree`, `Barn`, `Windmill`
  - `EffectsLayer` com a mesma assinatura, efeitos via Motion

- [ ] **Step 1: Criar `src/render/farm3d/motion3d.tsx`**

```tsx
import { useEffect, useRef, type ReactNode } from 'react'
import { animate } from 'motion'
import type { Group } from 'three'
import { EASINGS } from '@/motion/easings'
import { SPRINGS } from '@/motion/springs'

export function SpringIn({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useEffect(() => {
    const group = ref.current
    if (!group) return
    if (!enabled) {
      group.scale.setScalar(1)
      return
    }
    group.scale.setScalar(0.2)
    const controls = animate(group.scale, { x: 1, y: 1, z: 1 }, SPRINGS.bounce)
    return () => controls.stop()
  }, [enabled])
  return <group ref={ref}>{children}</group>
}

export function Sway({ enabled, seed, children }: { enabled: boolean; seed: number; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useEffect(() => {
    const group = ref.current
    if (!group || !enabled) return
    const amplitude = 0.025 + (seed % 3) * 0.008
    const controls = animate(
      group.rotation,
      { z: [0, amplitude, -amplitude, 0] },
      { duration: 4 + (seed % 5) * 0.6, repeat: Infinity, ease: EASINGS.easeInOutSine, delay: (seed % 7) * 0.3 },
    )
    return () => controls.stop()
  }, [enabled, seed])
  return <group ref={ref}>{children}</group>
}
```

- [ ] **Step 2: Substituir `src/render/farm3d/PlotTile.tsx`**

Manter `WoodFrame`, `Furrows`, `WetMarker`, `GoalMarker`, `Grass` e os ramos de `obstacle`, `blocked`, `reservoir`, `seedDepot` exatamente como estão, com estas mudanças:
- Props passam a incluir `growTicks: number`; `Soil` recebe `growTicks`.
- Importar `Model` de `@/render/models/Model`, `cropModelId`, `cropStageFor` de `@/render/models/modelChoice` e `SpringIn` de `@/render/farm3d/motion3d`.
- No `Soil`, substituir o bloco das plantas por:
```tsx
      {(() => {
        const stage = cropStageFor(cell.plot, cell.growth, growTicks)
        if (stage === null) return null
        const legacy = cell.plot === 'seeded' ? 'seeded' : cell.plot === 'growing' ? 'growing' : 'mature'
        return (
          <group position={[0, BED_HEIGHT, 0]}>
            <SpringIn key={stage} enabled={!reducedMotion}>
              <Model id={cropModelId(stage)} fallback={<PlantModel stage={legacy} reducedMotion />} />
            </SpringIn>
          </group>
        )
      })()}
      {cell.plot === 'harvested' && (
        <group position={[0, BED_HEIGHT, 0]}>
          <Model id="straw" fallback={<PlantModel stage="harvested" reducedMotion />} />
        </group>
      )}
```
- Trocar o `mesh` da base do solo em `Soil` por `<SoilBed color={color} />`, com este componente no mesmo arquivo (cor do solo faz crossfade em 700 ms):
```tsx
function SoilBed({ color }: { color: string }) {
  const material = useRef<MeshStandardMaterial>(null)
  useEffect(() => {
    const current = material.current
    if (!current) return
    const target = new Color(color)
    const controls = animate(current.color, { r: target.r, g: target.g, b: target.b }, { duration: 0.7, ease: EASINGS.easeInOutSine })
    return () => controls.stop()
  }, [color])
  return (
    <mesh position={[0, BED_HEIGHT / 2, 0]} receiveShadow castShadow>
      <boxGeometry args={[0.94, BED_HEIGHT, 0.94]} />
      <meshStandardMaterial ref={material} color={color} flatShading roughness={0.85} metalness={0.02} />
    </mesh>
  )
}
```
  com imports `import { useEffect, useRef } from 'react'`, `import { animate } from 'motion'`, `import { Color, type MeshStandardMaterial } from 'three'`, `import { EASINGS } from '@/motion/easings'`.
- No ramo `obstacle`, envolver as duas pedras procedurais como `fallback` de `<Model id="rock-a" fallback={...} />`; no ramo `blocked`, os arbustos procedurais como `fallback` de `<Model id="bush" fallback={...} />`; no `reservoir` e no `seedDepot`, as versões procedurais como `fallback` de `<Model id="reservoir" .../>` e `<Model id="seed-depot" .../>`. Manter `<Grass />` fora do `Model`.

- [ ] **Step 3: Substituir `src/render/farm3d/Decorations.tsx`**

Manter as funções procedurais `Tree`, `Pine`, `Rock`, `Bush`, `Fence`, `Barn`, `Silo` como estão. Trocar `Windmill` e `Decorations` por:
```tsx
export function Windmill({ animate: spin }: { animate: boolean }) {
  const blades = useRef<Group>(null)
  useEffect(() => {
    const group = blades.current
    if (!group || !spin) return
    const controls = animateValue(group.rotation, { z: [0, Math.PI * 2] }, { duration: 8, repeat: Infinity, ease: 'linear' })
    return () => controls.stop()
  }, [spin])
  return (
    <group>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.45, 2.8, 4]} />
        <Flat color={PALETTE.fence} />
      </mesh>
      <group ref={blades} position={[0, 2.8, 0.35]}>
        {[0, 1, 2, 3].map((index) => (
          <mesh key={index} rotation={[0, 0, (index * Math.PI) / 2]}>
            <boxGeometry args={[0.16, 1.5, 0.03]} />
            <Flat color={PALETTE.barnTrim} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function procedural(item: Decoration, ambient: boolean): ReactNode {
  switch (item.kind) {
    case 'tree':
      return <Tree variant={item.variant} />
    case 'pine':
      return <Pine />
    case 'rock':
      return <Rock />
    case 'bush':
      return <Bush />
    case 'fence':
      return <Fence />
    case 'barn':
      return <Barn />
    case 'windmill':
      return <Windmill animate={ambient} />
    case 'silo':
      return <Silo />
  }
}

const SWAYING: Decoration['kind'][] = ['tree', 'pine', 'bush']

export function Decorations({ items, animate: ambient }: { items: Decoration[]; animate: boolean }) {
  return (
    <>
      {items.map((item, index) => (
        <group key={index} position={[item.x, 0, item.z]} rotation={[0, item.rotation, 0]} scale={item.scale}>
          <Sway enabled={ambient && SWAYING.includes(item.kind)} seed={index}>
            {item.kind === 'windmill' ? (
              procedural(item, ambient)
            ) : (
              <Model id={decorationModelId(item.kind, item.variant)} fallback={procedural(item, ambient)} />
            )}
          </Sway>
        </group>
      ))}
    </>
  )
}
```
Imports do arquivo: `import { useEffect, useRef, type ReactNode } from 'react'`, `import { animate as animateValue } from 'motion'`, `import type { Group } from 'three'`, `import { Model } from '@/render/models/Model'`, `import { decorationModelId } from '@/render/models/modelChoice'`, `import { Sway } from '@/render/farm3d/motion3d'`, além dos já existentes (`PALETTE`, `Flat`, `Decoration`). Remover o import de `useFrame`.

- [ ] **Step 4: Substituir `src/render/farm3d/Effects.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import type { Group } from 'three'
import { EASINGS } from '@/motion/easings'
import { SPRINGS } from '@/motion/springs'
import { PALETTE } from '@/render/palette'
import { cellToWorld } from '@/render/sceneLayout'
import type { GameEvent } from '@/game/world/types'

interface EffectProps {
  x: number
  z: number
  seconds: number
}

function useFinished(): [boolean, () => void] {
  const [finished, setFinished] = useState(false)
  return [finished, () => setFinished(true)]
}

function WaterSplash({ x, z, seconds }: EffectProps) {
  const ref = useRef<Group>(null)
  const [finished, finish] = useFinished()
  useEffect(() => {
    const group = ref.current
    if (!group) return
    const controls = animate(group.position, { y: [1.2, 0.25] }, { duration: seconds, ease: EASINGS.easeInQuad })
    controls.then(finish)
    return () => controls.stop()
  }, [seconds])
  if (finished) return null
  return (
    <group ref={ref} position={[x, 1.2, z]}>
      {[
        [-0.15, 0],
        [0.12, 0.1],
        [0, -0.14],
        [0.18, -0.08],
      ].map(([dx, dz], index) => (
        <mesh key={index} position={[dx, index * 0.08, dz]}>
          <sphereGeometry args={[0.05, 6, 5]} />
          <meshBasicMaterial color={PALETTE.waterLight} />
        </mesh>
      ))}
    </group>
  )
}

function HarvestPop({ x, z, seconds }: EffectProps) {
  const ref = useRef<Group>(null)
  const [finished, finish] = useFinished()
  useEffect(() => {
    const group = ref.current
    if (!group) return
    const lift = animate(group.position, { y: [0.5, 1.7, 1.4] }, { duration: seconds, ease: EASINGS.easeOutCubic })
    const shrink = animate(group.scale, { x: [1, 1.3, 0], y: [1, 1.3, 0], z: [1, 1.3, 0] }, { duration: seconds, ease: EASINGS.easeInCubic })
    Promise.all([lift, shrink]).then(finish)
    return () => {
      lift.stop()
      shrink.stop()
    }
  }, [seconds])
  if (finished) return null
  return (
    <group ref={ref} position={[x, 0.5, z]}>
      <mesh>
        <icosahedronGeometry args={[0.14, 1]} />
        <meshBasicMaterial color={PALETTE.fruit} />
      </mesh>
    </group>
  )
}

function SeedDrop({ x, z }: EffectProps) {
  const ref = useRef<Group>(null)
  const [finished, finish] = useFinished()
  useEffect(() => {
    const group = ref.current
    if (!group) return
    const controls = animate(group.position, { y: [1, 0.22] }, SPRINGS.bounce)
    controls.then(finish)
    return () => controls.stop()
  }, [])
  if (finished) return null
  return (
    <group ref={ref} position={[x, 1, z]}>
      <mesh>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshBasicMaterial color={PALETTE.soilTilled} />
      </mesh>
    </group>
  )
}

interface EffectsLayerProps {
  events: GameEvent[]
  eventKey: number
  gridWidth: number
  gridHeight: number
  durationMs: number
}

export function EffectsLayer({ events, eventKey, gridWidth, gridHeight, durationMs }: EffectsLayerProps) {
  const seconds = Math.max(durationMs, 350) / 1000
  return (
    <>
      {events.map((event, index) => {
        const key = `${eventKey}-${index}`
        if (event.type === 'moistureChanged' && event.moisture === 'wet') {
          const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
          return <WaterSplash key={key} x={point.x} z={point.z} seconds={seconds} />
        }
        if (event.type === 'plotChanged' && event.to === 'harvested') {
          const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
          return <HarvestPop key={key} x={point.x} z={point.z} seconds={seconds} />
        }
        if (event.type === 'plotChanged' && event.to === 'seeded') {
          const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
          return <SeedDrop key={key} x={point.x} z={point.z} seconds={seconds} />
        }
        return null
      })}
    </>
  )
}
```

- [ ] **Step 5: Typecheck e suíte**

Run: `npm run typecheck && npx vitest run`
Expected: PASS (a cena ainda não passa `growTicks` — a Task 6.3 conecta; se o typecheck acusar a prop ausente em `FarmScene`, faça a Task 6.3 Step 2 agora e siga).

- [ ] **Step 6: Commit**

```bash
git add src/render
git commit -m "feat(render): use CC0 models for crops and scenery with spring growth, sway and motion effects"
```

---

### Task 6.3: Robô, câmera, cena, fallback 2D e alerta de erro

**Files:**
- Modify (substituir): `src/render/farm3d/RobotModel.tsx`, `src/render/farm3d/CameraRig.tsx`, `src/render/farm3d/FarmScene.tsx`
- Modify: `src/render/FarmView.tsx`, `src/render/FarmView.test.tsx`, `src/render/grid2d/Grid2D.tsx`, `src/render/grid2d/Grid2D.css`, `src/features/home/HomeScene.tsx`, `src/features/results/CelebrationScene.tsx`, `src/features/gameplay/GameplayPage.tsx`, `src/render/FarmView.css`

**Interfaces:**
- Consumes: Tasks 6.1–6.2, `scaleSpring`, `SPRINGS`, `BASE_STEP_DELAY_MS`, `ERROR_SHAKE`.
- Produces:
  - `FarmSceneProps` ganha `growTicks: number` e `celebrating: boolean`
  - `FarmView` ganha props `growTicks: number` e `celebrating?: boolean`
  - `RobotModel({ robot, gridWidth, gridHeight, durationMs, failed, celebrating, reducedMotion })`, `RobotShowcase({ clip })` (para a tela de resultado), `RobotBody` (procedural, mantido)
  - `CameraRig` ganha prop `kickKey?: number`

- [ ] **Step 1: Substituir `src/render/farm3d/RobotModel.tsx`**

```tsx
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { RoundedBox, useAnimations } from '@react-three/drei'
import { animate } from 'motion'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { BASE_STEP_DELAY_MS } from '@/game/execution/types'
import { ERROR_SHAKE } from '@/motion/presets'
import { scaleSpring, SPRINGS } from '@/motion/springs'
import { Flat } from '@/render/farm3d/materials'
import { modelEntry, type ModelEntry } from '@/render/models/manifest'
import { ModelBoundary, useClonedScene } from '@/render/models/Model'
import { robotClipFor, type RobotClip } from '@/render/models/modelChoice'
import { PALETTE } from '@/render/palette'
import { cellToWorld, FACING_YAW } from '@/render/sceneLayout'
import { useGLTF } from '@react-three/drei'
import { modelUrl } from '@/render/models/manifest'
import type { Robot } from '@/game/world/types'

export function RobotBody({ failed = false }: { failed?: boolean }) {
  return (
    <group>
      <RoundedBox args={[0.56, 0.5, 0.46]} radius={0.1} smoothness={3} position={[0, 0.45, 0]} castShadow>
        <meshStandardMaterial color={PALETTE.robotBody} roughness={0.5} emissive={failed ? PALETTE.error : '#000000'} emissiveIntensity={failed ? 0.35 : 0} />
      </RoundedBox>
      <RoundedBox args={[0.42, 0.26, 0.04]} radius={0.05} smoothness={2} position={[0, 0.5, 0.235]}>
        <meshStandardMaterial color={PALETTE.robotVisor} roughness={0.3} />
      </RoundedBox>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.262]}>
          <circleGeometry args={[0.055, 16]} />
          <meshBasicMaterial color={failed ? PALETTE.error : PALETTE.robotEye} />
        </mesh>
      ))}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.14, 6]} />
        <Flat color={PALETTE.robotTrim} />
      </mesh>
      <mesh position={[0, 0.87, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshBasicMaterial color={PALETTE.robotEye} />
      </mesh>
      {[-0.31, 0.31].map((x) => (
        <mesh key={x} position={[x, 0.18, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.1, 14]} />
          <Flat color={PALETTE.wheel} />
        </mesh>
      ))}
    </group>
  )
}

function RobotGltf({ entry, clip }: { entry: ModelEntry; clip: RobotClip }) {
  const object = useClonedScene(entry)
  const { animations } = useGLTF(modelUrl(entry))
  const recolored = useMemo(() => {
    object.traverse((child) => {
      const mesh = child as Mesh
      if (!mesh.isMesh) return
      const material = mesh.material as MeshStandardMaterial
      const color = entry.recolor?.[material.name]
      if (!color) return
      const copy = material.clone()
      copy.color.set(color)
      mesh.material = copy
    })
    return object
  }, [object, entry])
  const { actions } = useAnimations(animations, recolored)

  useEffect(() => {
    const name = entry.clips?.[clip]
    const action = name ? actions[name] : undefined
    if (!action) return
    action.reset().fadeIn(0.2).play()
    return () => {
      action.fadeOut(0.2)
    }
  }, [clip, actions, entry])

  return <primitive object={recolored} scale={entry.scale} position={[0, entry.yOffset, 0]} rotation={[0, entry.rotationY, 0]} />
}

function RobotVisual({ clip, failed }: { clip: RobotClip; failed: boolean }) {
  const entry = modelEntry('robot')
  const fallback = (
    <group scale={1.3}>
      <RobotBody failed={failed} />
    </group>
  )
  if (!entry) return fallback
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <RobotGltf entry={entry} clip={clip} />
      </Suspense>
    </ModelBoundary>
  )
}

export function RobotShowcase({ clip }: { clip: RobotClip }) {
  return <RobotVisual clip={clip} failed={false} />
}

function shortestAngle(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2)
  if (diff > Math.PI) diff -= Math.PI * 2
  if (diff < -Math.PI) diff += Math.PI * 2
  return from + diff
}

interface RobotModelProps {
  robot: Robot
  gridWidth: number
  gridHeight: number
  durationMs: number
  failed: boolean
  celebrating: boolean
  reducedMotion: boolean
}

export function RobotModel({ robot, gridWidth, gridHeight, durationMs, failed, celebrating, reducedMotion }: RobotModelProps) {
  const ref = useRef<Group>(null)
  const [moving, setMoving] = useState(false)
  const target = cellToWorld(robot.x, robot.y, gridWidth, gridHeight)
  const speed = durationMs > 0 ? BASE_STEP_DELAY_MS / durationMs : 1

  useEffect(() => {
    const group = ref.current
    if (!group) return
    const yaw = FACING_YAW[robot.facing]
    if (reducedMotion || durationMs <= 0) {
      group.position.set(target.x, 0.18, target.z)
      group.rotation.y = yaw
      return
    }
    setMoving(true)
    const move = animate(group.position, { x: target.x, z: target.z }, scaleSpring(SPRINGS.smooth, speed))
    const turn = animate(group.rotation, { y: shortestAngle(group.rotation.y, yaw) }, scaleSpring(SPRINGS.snap, speed))
    Promise.all([move, turn]).then(() => setMoving(false))
    return () => {
      move.stop()
      turn.stop()
    }
  }, [target.x, target.z, robot.facing, reducedMotion, durationMs, speed])

  useEffect(() => {
    const group = ref.current
    if (!group || !failed || reducedMotion) return
    const x = group.position.x
    const shake = animate(group.position, { x: ERROR_SHAKE.keyframes.x.map((offset) => x + offset / 120) }, ERROR_SHAKE.options)
    return () => shake.stop()
  }, [failed, reducedMotion])

  return (
    <group ref={ref} position={[target.x, 0.18, target.z]} rotation={[0, FACING_YAW[robot.facing], 0]}>
      <RobotVisual clip={robotClipFor({ moving, failed, celebrating })} failed={failed} />
      <mesh position={[0, 0.03, 0.62]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <circleGeometry args={[0.16, 3]} />
        <meshBasicMaterial color={PALETTE.arrow} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
```
Ajuste a ordem dos imports para agrupar `useGLTF`/`useAnimations`/`RoundedBox` num único import de `@react-three/drei` e `modelEntry`/`modelUrl` num único import de `manifest`.

- [ ] **Step 2: Substituir `src/render/farm3d/CameraRig.tsx`**

```tsx
import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { animate } from 'motion'
import { useMotionValue } from 'motion/react'
import type { OrthographicCamera } from 'three'
import { EASINGS } from '@/motion/easings'
import { SPRINGS } from '@/motion/springs'

interface CameraRigProps {
  gridWidth: number
  gridHeight: number
  quarterTurns: number
  zoomLevel: number
  showcase: boolean
  reducedMotion: boolean
  kickKey?: number
}

const DISTANCE = 24

function baseAngle(quarterTurns: number): number {
  return Math.PI / 4 + quarterTurns * (Math.PI / 2)
}

export function CameraRig({ gridWidth, gridHeight, quarterTurns, zoomLevel, showcase, reducedMotion, kickKey = 0 }: CameraRigProps) {
  const camera = useThree((three) => three.camera) as OrthographicCamera
  const size = useThree((three) => three.size)
  const angle = useMotionValue(baseAngle(quarterTurns))
  const zoom = useMotionValue(zoomLevel)
  const dolly = useMotionValue(reducedMotion ? 1 : 0.75)
  const kick = useMotionValue(0)

  useEffect(() => {
    const controls = animate(angle, baseAngle(quarterTurns), reducedMotion ? { duration: 0 } : SPRINGS.smooth)
    return () => controls.stop()
  }, [quarterTurns, reducedMotion, angle])

  useEffect(() => {
    const controls = animate(zoom, zoomLevel, reducedMotion ? { duration: 0 } : SPRINGS.smooth)
    return () => controls.stop()
  }, [zoomLevel, reducedMotion, zoom])

  useEffect(() => {
    if (reducedMotion) {
      dolly.set(1)
      return
    }
    const controls = animate(dolly, 1, { duration: 1.4, ease: EASINGS.easeOutCubic })
    return () => controls.stop()
  }, [reducedMotion, dolly])

  useEffect(() => {
    if (!kickKey || reducedMotion) return
    const controls = animate(kick, [0, 0.35, -0.25, 0.1, 0], { duration: 0.5, ease: EASINGS.easeOutExpo })
    return () => controls.stop()
  }, [kickKey, reducedMotion, kick])

  useFrame((three) => {
    const spin = showcase && !reducedMotion ? three.clock.elapsedTime * 0.05 : 0
    const current = angle.get() + spin
    const extent = Math.max(gridWidth, gridHeight) + 5
    camera.zoom = (Math.min(size.width, size.height) / extent) * zoom.get() * 0.95 * dolly.get()
    camera.updateProjectionMatrix()
    camera.position.set(Math.sin(current) * DISTANCE + kick.get(), DISTANCE * 0.82, Math.cos(current) * DISTANCE)
    camera.lookAt(kick.get() * 0.5, 0, 0)
  })

  return null
}
```

- [ ] **Step 3: Atualizar `FarmScene`, `FarmView` e chamadores**

`src/render/FarmView.tsx`:
- `FarmSceneProps` ganha `growTicks: number` e `celebrating: boolean`; `FarmViewProps` ganha `growTicks: number` e `celebrating?: boolean`.
- Passar `celebrating={props.celebrating ?? false}` à cena.
- Trocar o fallback do `Suspense` por `<SceneLoading />` (import de `@/render/SceneLoading`).
- Após `<div className="farm-view__stage">…</div>`, acrescentar o pulso de borda no erro:
```tsx
      <AnimatePresence>
        {props.failed && decorative && (
          <motion.div
            key={`damage-${props.eventKey}`}
            className="farm-view__damage"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0.2, 0.7, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: EASINGS.easeOutExpo }}
          />
        )}
      </AnimatePresence>
```
com `import { AnimatePresence, motion } from 'motion/react'`, `import { EASINGS } from '@/motion/easings'`, `import { useMotionPrefs } from '@/motion/useMotionPrefs'` e `const { decorative } = useMotionPrefs()`.

Em `FarmView.css`:
```css
.farm-view__damage {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  box-shadow: inset 0 0 0 6px rgb(229 72 77 / 0.9), inset 0 0 60px rgb(229 72 77 / 0.6);
  border-radius: var(--radius-lg);
}
```

`src/render/farm3d/FarmScene.tsx`:
- Desestruturar `growTicks` e `celebrating`.
- `<CameraRig ... kickKey={failed ? eventKey : 0} />`.
- `<PlotTile ... growTicks={growTicks} />`.
- `<RobotModel robot={state.robot} gridWidth={width} gridHeight={height} durationMs={duration} failed={failed} celebrating={celebrating} reducedMotion={reducedMotion} />`.
- `<Decorations items={decorations} animate={!reducedMotion && !lowGraphics} />`.

`src/render/FarmView.test.tsx`: acrescentar `growTicks: 3` ao objeto `props`.

`src/features/home/HomeScene.tsx`: passar `growTicks={3}` e `celebrating={false}` ao `FarmScene`.

`src/features/gameplay/GameplayPage.tsx`: no `<FarmView … />` acrescentar `growTicks={mission.growTicks}` e `celebrating={succeeded}`.

`src/features/results/CelebrationScene.tsx`: trocar `<group scale={1.6}><RobotBody /></group>` por `<group scale={1.6}><RobotShowcase clip="success" /></group>` e o import de `RobotBody` por `RobotShowcase`.

- [ ] **Step 4: Fallback 2D com Motion (`src/render/grid2d/Grid2D.tsx`)**

- Importar `import { LayoutGroup, motion } from 'motion/react'`, `import { useId } from 'react'` (junto aos imports existentes), `import { SPRINGS } from '@/motion/springs'`, `import { ERROR_SHAKE } from '@/motion/presets'`.
- Envolver o `div role="grid"` em `<LayoutGroup id={useId()}>`.
- Trocar o `span.grid2d__glyph` por:
```tsx
                <motion.span
                  key={`${cell.plot}-${cell.moisture}`}
                  className="grid2d__glyph"
                  aria-hidden="true"
                  initial={{ scale: 0.3 }}
                  animate={{ scale: 1 }}
                  transition={SPRINGS.bounce}
                >
                  {glyph}
                </motion.span>
```
- Trocar o `span.grid2d__robot` por:
```tsx
                  <motion.span
                    layoutId="grid2d-robot"
                    className={`grid2d__robot${failed ? ' grid2d__robot--failed' : ''}`}
                    aria-hidden="true"
                    animate={failed ? { rotate: FACING_ROTATION[state.robot.facing], ...ERROR_SHAKE.keyframes } : { rotate: FACING_ROTATION[state.robot.facing] }}
                    transition={failed ? ERROR_SHAKE.options : SPRINGS.snap}
                  >
                    ▲
                  </motion.span>
```
(sem `style={{ transform }}`).
- Em `Grid2D.css`, remover `transition` de `.grid2d__robot`, a `animation` de `.grid2d__robot--failed`, `@keyframes grid2d-shake` e o media query de movimento reduzido.

- [ ] **Step 5: Rodar tudo**

Run: `npm run typecheck && npx vitest run`
Expected: PASS (Grid2D e FarmView mantêm os mesmos rótulos acessíveis).

- [ ] **Step 6: Verificação visual (obrigatória)**

`npm run dev`, 1440×900, modo 3D:
1. `#/jogar/m1-first-harvest`: carregamento com shimmer; câmera faz dolly-in; árvores/pedras/cercas são os modelos Kenney; robô é o modelo Quaternius branco com olhos ciano, parado em "idle".
2. Executar a solução: robô anda com mola e clipe de caminhada, vira com mola; colheita faz o fruto saltar e o voo até o HUD.
3. Programa errado: robô toca o clipe de erro e treme, câmera dá um tranco, borda vermelha pulsa.
4. Fase 2 e 3: semente cai com quique; planta troca de estágio crescendo com mola; gotas caem na rega.
5. Ajustar `scale`/`yOffset`/`rotationY` em `scripts/assets/assets.config.json` até cada modelo caber no canteiro (~0,9) e o robô ter ~0,9 de altura; rodar `npm run assets:build` de novo.
6. Configurações › Visual › Gráficos leves: sem sombras, sem balanço; "Reduzir animações": robô e plantas trocam de estado sem animação.
7. Modo 2D: glifos crescem ao mudar de estado, robô desliza entre células.

Comparar screenshots com `reference/AgroBlocks_ Fazenda Inteligente em Ação.png`.

- [ ] **Step 7: Commit**

```bash
git add src scripts/assets public/models
git commit -m "feat(render): animate GLB robot, camera and 2D fallback with Motion springs scaled by game speed"
```
