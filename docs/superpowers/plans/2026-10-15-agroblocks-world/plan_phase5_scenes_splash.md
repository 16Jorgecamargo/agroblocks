# AgroBlocks World — Fase 5: Splash de carregamento, mapa de missões e tela inicial

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uma splash animada com progresso real cobre cada cena 3D até tudo carregar; o mapa de missões vira a ilha com rio, pontes, trilha e floresta; a tela inicial ganha o pátio, cata-vento, pasto e floresta da referência.

**Architecture:** `SceneWithSplash` (render-prop que entrega `onReady` ao canvas) combina `useProgress` do drei com `onCreated` do canvas; substitui o `SceneLoading`. `MissionMapScene` e `HomeLandscape` passam a desenhar `buildWorld` com `WorldTerrain`, `WorldProps`, `Herd`, `Butterflies`.

**Spec:** seções 4.4, 4.5, 5c · Leia `plan_index.md` antes.

---

### Task 5.1: `SceneWithSplash`

**Files:**
- Create: `src/render/SceneWithSplash.tsx`, `src/render/SceneWithSplash.test.tsx`, `src/render/SceneSplash.css`
- Delete: `src/render/SceneLoading.tsx`, `src/render/SceneLoading.test.tsx` (e as regras `.scene-loading*` de `src/render/FarmView.css`)
- Modify: `src/render/FarmView.tsx`, `src/render/farm3d/FarmScene.tsx`

**Interfaces:**
- Consumes: `useProgress` (`@react-three/drei`), `Logo`, `DURATIONS.splashHold`, `DURATIONS.fadeExit`, `EASINGS`.
- Produces: `SceneSplash({ progress, label })`; `SceneWithSplash({ children: (onReady: () => void) => ReactNode, label?: string })`.

- [ ] **Step 1: Teste que falha `src/render/SceneWithSplash.test.tsx`**

```tsx
import { act, render, screen, waitFor } from '@testing-library/react'
import { SceneWithSplash } from '@/render/SceneWithSplash'

const loader = { active: false, progress: 0 }

vi.mock('@react-three/drei', () => ({
  useProgress: () => loader,
}))

function Ready({ onReady }: { onReady: () => void }) {
  return (
    <button type="button" onClick={onReady}>
      canvas
    </button>
  )
}

describe('SceneWithSplash', () => {
  beforeEach(() => {
    loader.active = false
    loader.progress = 0
  })

  it('covers the scene with a loading status and real progress', () => {
    loader.active = true
    loader.progress = 40
    render(<SceneWithSplash>{(onReady) => <Ready onReady={onReady} />}</SceneWithSplash>)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando fazenda')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
  })

  it('stays while assets are still loading even after the canvas exists', async () => {
    loader.active = true
    render(<SceneWithSplash>{(onReady) => <Ready onReady={onReady} />}</SceneWithSplash>)
    act(() => screen.getByRole('button', { name: 'canvas' }).click())
    await new Promise((resolve) => setTimeout(resolve, 700))
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('leaves once the canvas exists and the loader is idle, even with no assets or a failed load', async () => {
    render(<SceneWithSplash>{(onReady) => <Ready onReady={onReady} />}</SceneWithSplash>)
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: 'canvas' }).click())
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument(), { timeout: 3000 })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/SceneWithSplash.test.tsx`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: `src/render/SceneWithSplash.tsx`**

```tsx
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useProgress } from '@react-three/drei'
import { animate } from 'motion'
import { AnimatePresence, motion } from 'motion/react'
import { Logo } from '@/components/brand/Logo'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import './SceneSplash.css'

export function SceneSplash({ progress, label }: { progress: number; label: string }) {
  const value = Math.round(progress)
  return (
    <motion.div className="scene-splash" role="status" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: DURATIONS.fadeExit, ease: EASINGS.easeOutCubic } }}>
      <Logo size="lg" />
      <span className="scene-splash__label">{label}</span>
      <div className="scene-splash__track" role="progressbar" aria-label="Progresso do carregamento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <motion.div className="scene-splash__bar" initial={false} animate={{ width: `${Math.max(6, value)}%` }} transition={{ duration: DURATIONS.quickExit, ease: EASINGS.easeOutCubic }} />
      </div>
      <span className="scene-splash__dots" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <motion.span key={index} animate={{ y: [0, -8, 0] }} transition={{ duration: DURATIONS.dotBounce, repeat: Infinity, delay: index * 0.12, ease: EASINGS.easeOutQuart }} />
        ))}
      </span>
    </motion.div>
  )
}

export function SceneWithSplash({ children, label = 'Carregando fazenda…' }: { children: (onReady: () => void) => ReactNode; label?: string }) {
  const { active, progress } = useProgress()
  const [ready, setReady] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!ready || active || hidden) return
    const hold = animate(0, 1, { duration: DURATIONS.splashHold })
    hold.then(() => setHidden(true))
    return () => hold.stop()
  }, [ready, active, hidden])

  return (
    <div className="scene-stage">
      <Suspense fallback={null}>{children(() => setReady(true))}</Suspense>
      <AnimatePresence>{!hidden && <SceneSplash key="splash" progress={progress} label={label} />}</AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 4: `src/render/SceneSplash.css`**

```css
.scene-stage {
  position: relative;
  width: 100%;
  height: 100%;
}

.scene-splash {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  background: radial-gradient(circle at 50% 40%, #1c2a35 0%, #131f29 70%);
  color: var(--chrome-text);
  font-weight: 700;
}

.scene-splash__label {
  font-size: var(--text-md);
}

.scene-splash__track {
  width: min(320px, 70vw);
  height: 10px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.12);
  overflow: hidden;
}

.scene-splash__bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #3c9a3a, #7ccf6a);
}

.scene-splash__dots {
  display: flex;
  gap: 6px;
}

.scene-splash__dots span {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #7ccf6a;
}
```

- [ ] **Step 5: Usar na fazenda**

Em `src/render/FarmView.tsx`: remover o import de `Suspense` se ficar sem uso e importar `SceneWithSplash`; trocar o bloco
```tsx
          <Suspense fallback={<SceneLoading />}>
            <FarmScene … />
          </Suspense>
```
(ou o fallback atual) por:
```tsx
          <SceneWithSplash>
            {(onReady) => (
              <FarmScene
                {...props}
                celebrating={props.celebrating ?? false}
                quarterTurns={quarterTurns}
                zoomLevel={ZOOM_LEVELS[zoomIndex]}
                lowGraphics={lowGraphics}
                reducedMotion={reducedMotion}
                onReady={onReady}
              />
            )}
          </SceneWithSplash>
```
Apagar `src/render/SceneLoading.tsx`, `src/render/SceneLoading.test.tsx` e as regras `.scene-loading`, `.scene-loading__shimmer`, `.scene-loading__dots`, `.scene-loading__dots span` de `src/render/FarmView.css`.

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/render --maxWorkers=2 && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A src/render
git commit -m "feat(render): cover 3D scenes with an animated loading splash"
```

---

### Task 5.2: Mapa de missões com o mundo

**Files:**
- Modify (substituir): `src/features/mission-select/MissionMapScene.tsx`
- Modify: `src/features/mission-select/missionMapLayout.ts`, `src/features/mission-select/missionMapLayout.test.ts`, `src/features/mission-select/MissionSelectPage.tsx`

**Interfaces:**
- Consumes: `buildWorld`, `WorldTerrain`, `WorldProps`, `Herd`, `Butterflies`, `SceneWithSplash`.
- Produces: `MissionMapScene` com prop nova `onReady?: () => void`; `missionMapLayout.ts` exporta só `NODE_POSITIONS` e `lockReason`.

- [ ] **Step 1: Ajustar testes (falham primeiro)**

Substituir `src/features/mission-select/missionMapLayout.test.ts` por:
```ts
import * as layout from '@/features/mission-select/missionMapLayout'

describe('missionMapLayout', () => {
  it('has one distinct node per mission', () => {
    expect(layout.NODE_POSITIONS).toHaveLength(7)
    expect(new Set(layout.NODE_POSITIONS.map(([x, z]) => `${x},${z}`)).size).toBe(7)
  })

  it('leaves scenery to the shared world builder', () => {
    expect(Object.keys(layout).sort()).toEqual(['NODE_POSITIONS', 'lockReason'])
  })

  it('explains why a mission is locked', () => {
    expect(layout.lockReason(3)).toBe('Conclua a fase 2 para desbloquear.')
  })
})
```
Run: `npx vitest run src/features/mission-select/missionMapLayout.test.ts`
Expected: FAIL — ainda exporta `RIVER_POINTS`, `BARN_POSITION`, `pathStones`, `mapScenery`.

- [ ] **Step 2: Enxugar `missionMapLayout.ts`**

Deixar apenas `screenToWorld` (não exportada), `NODE_POSITIONS` e `lockReason`; remover `RIVER_POINTS`, `BARN_POSITION`, `STONES_PER_SEGMENT`, `pathStones`, `mapScenery` e o import de `seededRandom`.

- [ ] **Step 3: Substituir `src/features/mission-select/MissionMapScene.tsx`**

Manter `MissionMapSceneProps` (+ `onReady?: () => void`), `NODE_COLORS` e o bloco de botões-rótulo (`missions.map(… <button className="map-label …">`) exatamente como estão. Trocar o restante por:
```tsx
import { useMemo, useRef, type RefObject } from 'react'
import { motion } from 'motion/react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { Icon } from '@/components/icons/Icon'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { MissionStatus } from '@/game/progress/types'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { PALETTE } from '@/render/palette'
import { buildWorld } from '@/render/world/buildWorld'
import { Butterflies } from '@/render/world/Butterflies'
import { Herd } from '@/render/world/Herd'
import { WorldProps } from '@/render/world/WorldProps'
import { WorldTerrain } from '@/render/world/WorldTerrain'
import type { Vec2 } from '@/render/world/worldTypes'

function LabelProjector({ labels, trail }: { labels: RefObject<(HTMLButtonElement | null)[]>; trail: Vec2[] }) {
  const camera = useThree((three) => three.camera)
  const size = useThree((three) => three.size)
  const point = useMemo(() => new Vector3(), [])
  useFrame(() => {
    trail.forEach(({ x, z }, index) => {
      const element = labels.current?.[index]
      if (!element) return
      point.set(x, 1.1, z).project(camera)
      element.style.transform = `translate(-50%, -100%) translate(${((point.x + 1) / 2) * size.width}px, ${((1 - point.y) / 2) * size.height}px)`
    })
  })
  return null
}

export default function MissionMapScene({ missions, statuses, selectedId, onSelect, lowGraphics, ambient, celebrateIds, onReady }: MissionMapSceneProps) {
  const world = useMemo(() => buildWorld({ layout: 'map', gridWidth: 0, gridHeight: 0, seed: 'mission-map', density: lowGraphics ? 'light' : 'full' }), [lowGraphics])
  const labels = useRef<(HTMLButtonElement | null)[]>([])
  const alive = ambient && !lowGraphics
  return (
    <div className="map-scene">
      <Canvas
        orthographic
        shadows={!lowGraphics}
        dpr={lowGraphics ? 1 : [1, 2]}
        camera={{ position: [16, 16, 16], zoom: 40, near: -200, far: 400 }}
        onCreated={() => onReady?.()}
        aria-hidden="true"
      >
        <color attach="background" args={['#131f29']} />
        <LabelProjector labels={labels} trail={world.trail} />
        <CameraRig gridWidth={18} gridHeight={10} quarterTurns={0} zoomLevel={1.32} showcase={false} reducedMotion />
        <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
        <directionalLight position={[10, 18, 8]} intensity={1.5} castShadow={!lowGraphics} shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} />
        <WorldTerrain world={world} />
        <WorldProps world={world} shadows={!lowGraphics} ambient={alive} />
        <Herd animals={world.animals} active={alive} />
        <Butterflies points={world.butterflies} active={alive} />
        {missions.map((mission) => {
          const node = world.trail[mission.order]
          const status = statuses[mission.id] ?? 'locked'
          const selected = mission.id === selectedId
          return (
            <group key={mission.id} position={[node.x, 0, node.z]}>
              <mesh
                position={[0, selected ? 0.4 : 0.2, 0]}
                castShadow
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(mission.id)
                }}
              >
                <cylinderGeometry args={[0.75, 0.8, 0.35, 6]} />
                <meshStandardMaterial color={NODE_COLORS[status]} flatShading emissive={selected ? NODE_COLORS[status] : '#000000'} emissiveIntensity={selected ? 0.4 : 0} />
              </mesh>
            </group>
          )
        })}
      </Canvas>
      {/* manter aqui, sem alteração, o bloco missions.map(... <button className="map-label ...">) atual */}
    </div>
  )
}
```
**Atenção:** a linha `{/* manter aqui … */}` é instrução deste plano, não código — no arquivo final cole o bloco de botões atual nesse lugar e não deixe comentário (regra do projeto).

- [ ] **Step 4: Splash no mapa**

Em `src/features/mission-select/MissionSelectPage.tsx`: importar `SceneWithSplash`; trocar
```tsx
            <Suspense fallback={<div className="mission-select__loading">Carregando mapa…</div>}>
              <MissionMapScene … />
            </Suspense>
```
por
```tsx
            <SceneWithSplash label="Carregando mapa…">
              {(onReady) => (
                <MissionMapScene
                  missions={MISSIONS}
                  statuses={statuses}
                  selectedId={selected.id}
                  onSelect={setSelectedId}
                  lowGraphics={lowGraphics}
                  ambient={ambient}
                  celebrateIds={celebrateIds}
                  onReady={onReady}
                />
              )}
            </SceneWithSplash>
```
Remover `Suspense` do import do React se ficar sem uso e a regra `.mission-select__loading` do CSS se existir.

- [ ] **Step 5: Rodar**

Run: `npx vitest run src/features/mission-select src/render --maxWorkers=2 && npm run typecheck`
Expected: PASS. `MissionSelectPage.test.tsx` roda sem WebGL (lista acessível) e não é afetado.

- [ ] **Step 6: Verificação visual**

Playwright MCP em `#/missoes` (1440×900): splash aparece e some; ilha com bordas de rocha sobre fundo azul-marinho; rio azul com duas pontes; trilha de terra ligando os 7 hexágonos; celeiros vermelhos, moinho, silo; floresta densa; ovelhas e vacas no cercado. Comparar com `.playwright-mcp/ref/map.png`. Fechar o navegador.

- [ ] **Step 7: Commit**

```bash
git add src/features/mission-select
git commit -m "feat(world): mission map island with river, bridges, forest and animals"
```

---

### Task 5.3: Tela inicial com o mundo

**Files:**
- Modify: `src/features/home/HomeLandscape.tsx`, `src/features/home/HomeScene.tsx`

**Interfaces:**
- Consumes: `buildWorld`, `WorldTerrain`, `WorldProps`, `Herd`, `Butterflies`, `SceneWithSplash`.
- Produces: `HomeLandscape({ ambient, lowGraphics, onReady? })`.

- [ ] **Step 1: Linha de base**

Run: `npx vitest run src/features/home src/app --maxWorkers=2`
Expected: PASS (testes rodam sem WebGL).

- [ ] **Step 2: Atualizar `src/features/home/HomeLandscape.tsx`**

- Remover imports de `Barn`, `Tree`, `Windmill` (`@/render/farm3d/Decorations`) e de `createRandom`/`hashString`; remover o `useMemo` `trees` e os JSX de árvores, dos dois `Barn`, do `Windmill` e do bloco de cerca (`[-3, -2, -1, 0, 1, 2, 3].map(…)`).
- Manter `HILLS`, `BED_CELLS`, `CameraDrift`, `IdleRobot`, o plano de chão, a névoa, as luzes e os canteiros.
- Acrescentar imports de `buildWorld`, `WorldTerrain`, `WorldProps`, `Herd`, `Butterflies` e a prop `onReady?: () => void`.
- No componente:
```tsx
  const world = useMemo(() => buildWorld({ layout: 'home', gridWidth: 0, gridHeight: 0, seed: 'home-landscape', density: lowGraphics ? 'light' : 'full' }), [lowGraphics])
  const alive = ambient && !lowGraphics
```
- No `<Canvas …>` acrescentar `onCreated={() => onReady?.()}` e, depois dos `HILLS`, inserir:
```tsx
      <WorldTerrain world={world} withGround={false} />
      <WorldProps world={world} shadows={!lowGraphics} ambient={alive} />
      <Herd animals={world.animals} active={alive} />
      <Butterflies points={world.butterflies} active={alive} />
```
- Mudar a `directionalLight` para `shadow-mapSize={[2048, 2048]}` com `shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16}`.

- [ ] **Step 3: Splash na tela inicial**

Em `src/features/home/HomeScene.tsx`, importar `SceneWithSplash` e trocar o `<Suspense …><HomeLandscape … /></Suspense>` por:
```tsx
      <SceneWithSplash label="Preparando a fazenda…">
        {(onReady) => <HomeLandscape ambient={ambient} lowGraphics={lowGraphics} onReady={onReady} />}
      </SceneWithSplash>
```
Remover `Suspense` do import se ficar sem uso.

- [ ] **Step 4: Rodar**

Run: `npx vitest run src/features/home src/app src/render --maxWorkers=2 && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Verificação visual**

Playwright MCP em `#/` (1440×900): celeiro grande vermelho à esquerda, caixa-d'água atrás, cata-vento de torre à direita, cerca atravessando à frente dos canteiros, vacas e ovelhas no cercado, morros com floresta e celeiros pequenos ao fundo, flores e grama no primeiro plano, robô à direita. Comparar com `.playwright-mcp/ref/home.png`; ajustar posições em `homeLayout.ts` se algo cobrir o logo/botões (registrar no ledger). Fechar o navegador.

- [ ] **Step 6: Commit**

```bash
git add src/features/home
git commit -m "feat(world): home landscape with farmyard, pasture and forest like the reference"
```
