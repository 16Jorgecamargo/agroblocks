# AgroBlocks — Fase 7: Renderização da fazenda (3D low-poly + fallback 2D)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cena Three.js procedural fiel à referência visual (`reference/AgroBlocks_ Fazenda Inteligente em Ação.png`): canteiros elevados com moldura de madeira, plantas por estágio, robô branco de visor escuro e olhos ciano, árvores/pedras/cercas/celeiro/moinho/silo ao redor, animações guiadas por eventos reais. Fallback 2D em CSS Grid com o mesmo estado.

**Architecture:** Lógica de layout, aleatoriedade determinística e descrições textuais são funções puras testadas. Componentes R3F só leem `GameState` + `GameEvent[]`; nunca mudam o estado do jogo. `FarmView` escolhe 3D ou 2D (configuração + detecção de WebGL) e carrega a cena 3D com `React.lazy`.

**Tech Stack:** three, @react-three/fiber, @react-three/drei (`RoundedBox`, `Html` — nada que baixe fontes ou assets externos), React, CSS.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seção 6)

Leia `plan_index.md` antes de começar. Abra a imagem de referência antes de ajustar cores e proporções.

---

### Task 7.1: Funções puras de cena (paleta, aleatoriedade, layout, descrições)

**Files:**
- Create: `src/render/palette.ts`
- Create: `src/render/seededRandom.ts`
- Create: `src/render/sceneLayout.ts`
- Create: `src/render/cellDescription.ts`
- Create: `src/render/hasWebGL.ts`
- Test: `src/render/sceneLayout.test.ts`, `src/render/cellDescription.test.ts`

**Interfaces:**
- Consumes: `Cell`, `Facing`, `GameState`, `PLOT_STATE_LABELS`.
- Produces:
  - `PALETTE` (cores nomeadas)
  - `hashString(value: string): number`, `createRandom(seed: number): () => number`
  - `interface WorldPoint { x: number; z: number }`, `cellToWorld(x: number, y: number, width: number, height: number): WorldPoint`
  - `FACING_YAW: Record<Facing, number>`
  - `type DecorationKind = 'tree' | 'pine' | 'rock' | 'bush' | 'fence' | 'barn' | 'windmill' | 'silo'`
  - `interface Decoration { kind: DecorationKind; x: number; z: number; rotation: number; scale: number; variant: number }`
  - `generateDecorations(width: number, height: number, seedKey: string, options: { dense: boolean }): Decoration[]`
  - `FACING_LABELS: Record<Facing, string>`, `describeCell(cell: Cell): string`, `describeRobot(state: GameState): string`
  - `hasWebGL(): boolean`

- [ ] **Step 1: Escrever testes que falham**

`src/render/sceneLayout.test.ts`:
```ts
import { cellToWorld, generateDecorations } from '@/render/sceneLayout'

describe('sceneLayout', () => {
  it('centers the grid on the origin', () => {
    expect(cellToWorld(0, 0, 3, 3)).toEqual({ x: -1, z: -1 })
    expect(cellToWorld(1, 1, 3, 3)).toEqual({ x: 0, z: 0 })
    expect(cellToWorld(3, 0, 4, 1)).toEqual({ x: 1.5, z: 0 })
  })

  it('is deterministic for the same seed', () => {
    expect(generateDecorations(5, 5, 'm1', { dense: true })).toEqual(generateDecorations(5, 5, 'm1', { dense: true }))
    expect(generateDecorations(5, 5, 'm1', { dense: true })).not.toEqual(generateDecorations(5, 5, 'm2', { dense: true }))
  })

  it('never places scenery on top of the playable grid', () => {
    const width = 8
    const height = 4
    for (const item of generateDecorations(width, height, 'seed', { dense: true })) {
      const insideX = Math.abs(item.x) < width / 2 + 0.5
      const insideZ = Math.abs(item.z) < height / 2 + 0.5
      expect(insideX && insideZ).toBe(false)
    }
  })

  it('surrounds the grid with fences and adds farm buildings', () => {
    const kinds = generateDecorations(4, 4, 'x', { dense: false }).map((item) => item.kind)
    expect(kinds.filter((kind) => kind === 'fence').length).toBeGreaterThanOrEqual(16)
    expect(kinds).toEqual(expect.arrayContaining(['barn', 'windmill', 'silo']))
  })

  it('creates fewer trees and rocks in low graphics mode', () => {
    const scenery = (dense: boolean) =>
      generateDecorations(6, 6, 's', { dense }).filter((item) => item.kind !== 'fence').length
    expect(scenery(false)).toBeLessThan(scenery(true))
  })
})
```

`src/render/cellDescription.test.ts`:
```ts
import { describeCell, describeRobot } from '@/render/cellDescription'
import { makeState } from '@/game/testing/makeState'

describe('cellDescription', () => {
  it('describes soil with plot state and moisture', () => {
    expect(describeCell({ terrain: 'soil', plot: 'growing', moisture: 'wet', growth: 0 })).toBe('planta em crescimento, solo molhado')
    expect(describeCell({ terrain: 'soil', plot: 'untilled', moisture: 'dry', growth: 0 })).toBe('solo sem preparo, solo seco')
  })

  it('describes non-soil terrain', () => {
    expect(describeCell({ terrain: 'reservoir', plot: 'untilled', moisture: 'dry', growth: 0 })).toBe('reservatório de água')
    expect(describeCell({ terrain: 'obstacle', plot: 'untilled', moisture: 'dry', growth: 0 })).toBe('pedra (obstáculo)')
  })

  it('describes the robot position, facing and current plot using 1-based coordinates', () => {
    expect(describeRobot(makeState(['. m'], { x: 1, facing: 'S' }))).toBe(
      'Robô na coluna 2, linha 1, virado para o Sul (para baixo). Canteiro atual: planta madura, solo seco.',
    )
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Criar `src/render/palette.ts`**

```ts
export const PALETTE = {
  sky: '#a8d8ea',
  grassLight: '#8cc65a',
  grassMid: '#72b04a',
  grassDark: '#548c36',
  soilDry: '#b98a5e',
  soilWet: '#6b4a32',
  soilTilled: '#9c6d47',
  soilUntilled: '#a7915f',
  woodFrame: '#7a5636',
  sprout: '#86cf5f',
  leaf: '#45a04a',
  leafDark: '#2f7a37',
  fruit: '#e2533b',
  fruitAlt: '#f29b38',
  straw: '#d9b86a',
  rock: '#9aa0a6',
  rockDark: '#737a80',
  water: '#4185d6',
  waterLight: '#86b9f0',
  robotBody: '#f4f6f5',
  robotTrim: '#cfd8d3',
  robotVisor: '#1b2730',
  robotEye: '#46e3ff',
  wheel: '#2b2f33',
  barnRed: '#c0392b',
  barnTrim: '#f5f1e8',
  roof: '#6f7b7f',
  fence: '#a57b52',
  trunk: '#7a5230',
  bush: '#3e7d3a',
  arrow: '#3d8bfd',
  marker: '#f2c14e',
  crate: '#c99a5b',
  sack: '#e8dcc0',
  metal: '#8a969c',
  error: '#e5484d',
} as const
```

- [ ] **Step 4: Criar `src/render/seededRandom.ts`**

```ts
export function hashString(value: string): number {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
```

- [ ] **Step 5: Criar `src/render/sceneLayout.ts`**

```ts
import { createRandom, hashString } from '@/render/seededRandom'
import type { Facing } from '@/game/world/types'

export interface WorldPoint {
  x: number
  z: number
}

export function cellToWorld(x: number, y: number, width: number, height: number): WorldPoint {
  return { x: x - (width - 1) / 2, z: y - (height - 1) / 2 }
}

export const FACING_YAW: Record<Facing, number> = {
  S: 0,
  E: Math.PI / 2,
  N: Math.PI,
  W: -Math.PI / 2,
}

export type DecorationKind = 'tree' | 'pine' | 'rock' | 'bush' | 'fence' | 'barn' | 'windmill' | 'silo'

export interface Decoration {
  kind: DecorationKind
  x: number
  z: number
  rotation: number
  scale: number
  variant: number
}

const FENCE_GAP = 0.95

function fences(width: number, height: number): Decoration[] {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const items: Decoration[] = []
  for (let column = 0; column < width; column += 1) {
    const x = column - (width - 1) / 2
    items.push({ kind: 'fence', x, z: -halfHeight - FENCE_GAP + 0.4, rotation: 0, scale: 1, variant: 0 })
    items.push({ kind: 'fence', x, z: halfHeight + FENCE_GAP - 0.4, rotation: 0, scale: 1, variant: 0 })
  }
  for (let row = 0; row < height; row += 1) {
    const z = row - (height - 1) / 2
    items.push({ kind: 'fence', x: -halfWidth - FENCE_GAP + 0.4, z, rotation: Math.PI / 2, scale: 1, variant: 0 })
    items.push({ kind: 'fence', x: halfWidth + FENCE_GAP - 0.4, z, rotation: Math.PI / 2, scale: 1, variant: 0 })
  }
  return items
}

export function generateDecorations(
  width: number,
  height: number,
  seedKey: string,
  options: { dense: boolean },
): Decoration[] {
  const random = createRandom(hashString(seedKey))
  const halfWidth = width / 2
  const halfHeight = height / 2
  const buildings: Decoration[] = [
    { kind: 'barn', x: -halfWidth - 3.4, z: -halfHeight - 2.4, rotation: Math.PI / 6, scale: 1, variant: 0 },
    { kind: 'windmill', x: halfWidth + 3.2, z: -halfHeight - 2.6, rotation: -Math.PI / 8, scale: 1, variant: 0 },
    { kind: 'silo', x: halfWidth + 2.8, z: halfHeight + 2.6, rotation: 0, scale: 1, variant: 0 },
  ]
  const target = options.dense ? 70 : 22
  const scenery: Decoration[] = []
  const outerX = halfWidth + 8
  const outerZ = halfHeight + 7
  for (let tries = 0; tries < target * 12 && scenery.length < target; tries += 1) {
    const x = (random() * 2 - 1) * outerX
    const z = (random() * 2 - 1) * outerZ
    if (Math.abs(x) < halfWidth + 1.6 && Math.abs(z) < halfHeight + 1.6) continue
    if (buildings.some((building) => Math.hypot(building.x - x, building.z - z) < 2.4)) continue
    if (scenery.some((item) => Math.hypot(item.x - x, item.z - z) < 0.9)) continue
    const roll = random()
    const kind: DecorationKind = roll < 0.5 ? 'tree' : roll < 0.7 ? 'pine' : roll < 0.88 ? 'rock' : 'bush'
    scenery.push({ kind, x, z, rotation: random() * Math.PI * 2, scale: 0.7 + random() * 0.6, variant: Math.floor(random() * 3) })
  }
  return [...fences(width, height), ...buildings, ...scenery]
}
```

- [ ] **Step 6: Criar `src/render/cellDescription.ts`**

```ts
import { PLOT_STATE_LABELS } from '@/game/missions/goals'
import { getCell } from '@/game/world/grid'
import type { Cell, Facing, GameState, Terrain } from '@/game/world/types'

export const FACING_LABELS: Record<Facing, string> = {
  N: 'o Norte (para cima)',
  E: 'o Leste (para a direita)',
  S: 'o Sul (para baixo)',
  W: 'o Oeste (para a esquerda)',
}

const TERRAIN_LABELS: Record<Exclude<Terrain, 'soil'>, string> = {
  obstacle: 'pedra (obstáculo)',
  blocked: 'área bloqueada',
  reservoir: 'reservatório de água',
  seedDepot: 'depósito de sementes',
}

export function describeCell(cell: Cell): string {
  if (cell.terrain !== 'soil') return TERRAIN_LABELS[cell.terrain]
  return `${PLOT_STATE_LABELS[cell.plot]}, solo ${cell.moisture === 'wet' ? 'molhado' : 'seco'}`
}

export function describeRobot(state: GameState): string {
  const { x, y, facing } = state.robot
  return `Robô na coluna ${x + 1}, linha ${y + 1}, virado para ${FACING_LABELS[facing]}. Canteiro atual: ${describeCell(getCell(state, state.robot))}.`
}
```

- [ ] **Step 7: Criar `src/render/hasWebGL.ts`**

```ts
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run src/render && npm run typecheck`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/render
git commit -m "feat(render): add deterministic scene layout and accessible cell descriptions"
```

---

### Task 7.2: Fallback 2D e `FarmView`

**Files:**
- Create: `src/render/grid2d/Grid2D.tsx`
- Create: `src/render/grid2d/Grid2D.css`
- Create: `src/render/FarmView.tsx`
- Create: `src/render/FarmView.css`
- Create: `src/render/farm3d/FarmScene.tsx` (stub mínimo exportando `default` que a Task 7.3 substitui por completo)
- Test: `src/render/grid2d/Grid2D.test.tsx`, `src/render/FarmView.test.tsx`

**Interfaces:**
- Consumes: `GameState`, `GameEvent`, `CellRef`, `describeCell`, `describeRobot`, `hasWebGL`, `useSettingsStore`, `useReducedMotion`.
- Produces:
  - `Grid2D({ state, highlightCells, failed }): JSX.Element`
  - `interface FarmSceneProps { state: GameState; lastEvents: GameEvent[]; eventKey: number; stepDurationMs: number; highlightCells: CellRef[]; failed: boolean; seedKey: string; quarterTurns: number; zoomLevel: number; lowGraphics: boolean; reducedMotion: boolean; showcase?: boolean }`
  - `FarmView({ state, lastEvents, eventKey, stepDurationMs, highlightCells, failed, seedKey }): JSX.Element` — barra de ferramentas (girar ↺ ↻, zoom − +, legenda), cena 3D ou 2D, descrição textual `aria-live="polite"` do robô.

- [ ] **Step 1: Escrever testes que falham**

`src/render/grid2d/Grid2D.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Grid2D } from '@/render/grid2d/Grid2D'
import { makeState } from '@/game/testing/makeState'

describe('Grid2D', () => {
  it('renders one labelled cell per grid position with the robot marked', () => {
    render(<Grid2D state={makeState(['. mw', '# R'], { x: 1, y: 0, facing: 'S' })} highlightCells={[[0, 0]]} failed={false} />)
    expect(screen.getAllByRole('gridcell')).toHaveLength(4)
    expect(screen.getByRole('gridcell', { name: /coluna 2, linha 1: planta madura, solo molhado, robô virado para o Sul/ })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: /coluna 1, linha 1: solo sem preparo, solo seco, objetivo/ })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: /coluna 2, linha 2: reservatório de água/ })).toBeInTheDocument()
  })
})
```

`src/render/FarmView.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { FarmView } from '@/render/FarmView'
import { makeState } from '@/game/testing/makeState'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

describe('FarmView', () => {
  const props = {
    state: makeState(['. .']),
    lastEvents: [],
    eventKey: 0,
    stepDurationMs: 500,
    highlightCells: [],
    failed: false,
    seedKey: 'test',
  }

  it('uses the 2D grid when 2D mode is selected', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: '2d' } })
    render(<FarmView {...props} />)
    expect(screen.getByRole('grid', { name: 'Mapa da fazenda' })).toBeInTheDocument()
  })

  it('falls back to 2D with a notice when WebGL is unavailable', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: 'auto' } })
    render(<FarmView {...props} />)
    expect(screen.getByRole('grid', { name: 'Mapa da fazenda' })).toBeInTheDocument()
    expect(screen.getByText(/3D não está disponível/)).toBeInTheDocument()
  })

  it('announces the robot description for screen readers', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: '2d' } })
    render(<FarmView {...props} />)
    expect(screen.getByText(/Robô na coluna 1, linha 1/)).toHaveAttribute('aria-live', 'polite')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/render/grid2d/Grid2D.tsx`**

```tsx
import type { CellRef } from '@/game/missions/goals'
import type { Cell, GameState } from '@/game/world/types'
import { describeCell, FACING_LABELS } from '@/render/cellDescription'
import './Grid2D.css'

interface Grid2DProps {
  state: GameState
  highlightCells: CellRef[]
  failed: boolean
}

const PLOT_GLYPHS: Record<Cell['plot'], string> = {
  untilled: '',
  tilled: '≡',
  seeded: '•',
  growing: '🌱',
  mature: '🍅',
  harvested: '✂',
}

const TERRAIN_GLYPHS: Record<Exclude<Cell['terrain'], 'soil'>, string> = {
  obstacle: '⛰',
  blocked: '✕',
  reservoir: '💧',
  seedDepot: '📦',
}

const FACING_ROTATION = { N: 0, E: 90, S: 180, W: 270 }

export function Grid2D({ state, highlightCells, failed }: Grid2DProps) {
  const highlighted = new Set(highlightCells.map(([x, y]) => `${x},${y}`))
  return (
    <div
      role="grid"
      aria-label="Mapa da fazenda"
      className="grid2d"
      style={{ gridTemplateColumns: `repeat(${state.width}, minmax(0, 1fr))` }}
    >
      {state.cells.map((row, y) => (
        <div role="row" key={y} className="grid2d__row">
          {row.map((cell, x) => {
            const hasRobot = state.robot.x === x && state.robot.y === y
            const isGoal = highlighted.has(`${x},${y}`)
            const parts = [`coluna ${x + 1}, linha ${y + 1}: ${describeCell(cell)}`]
            if (isGoal) parts.push('objetivo')
            if (hasRobot) parts.push(`robô virado para ${FACING_LABELS[state.robot.facing]}`)
            const glyph = cell.terrain === 'soil' ? PLOT_GLYPHS[cell.plot] : TERRAIN_GLYPHS[cell.terrain]
            return (
              <div
                role="gridcell"
                key={x}
                aria-label={parts.join(', ')}
                className={[
                  'grid2d__cell',
                  `grid2d__cell--${cell.terrain}`,
                  cell.terrain === 'soil' ? `grid2d__cell--${cell.plot}` : '',
                  cell.moisture === 'wet' ? 'grid2d__cell--wet' : '',
                  isGoal ? 'grid2d__cell--goal' : '',
                ].join(' ')}
              >
                <span className="grid2d__glyph" aria-hidden="true">
                  {glyph}
                </span>
                {cell.moisture === 'wet' && cell.terrain === 'soil' && (
                  <span className="grid2d__drop" aria-hidden="true">
                    💧
                  </span>
                )}
                {hasRobot && (
                  <span
                    className={`grid2d__robot${failed ? ' grid2d__robot--failed' : ''}`}
                    style={{ transform: `rotate(${FACING_ROTATION[state.robot.facing]}deg)` }}
                    aria-hidden="true"
                  >
                    ▲
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
```

`role="row"` com `display: contents` mantém a grade CSS única. O fallback 2D usa glifos textuais **além** de cor e forma; a cena 3D (Task 7.3) usa geometria própria.

- [ ] **Step 4: Criar `src/render/grid2d/Grid2D.css`**

```css
.grid2d {
  display: grid;
  gap: 4px;
  padding: var(--space-3);
  background: #6fae3f;
  border-radius: var(--radius-lg);
  aspect-ratio: auto;
}

.grid2d__row {
  display: contents;
}

.grid2d__cell {
  position: relative;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  font-size: clamp(14px, 2.4vw, 26px);
  background: #a7915f;
  border: 3px solid transparent;
}

.grid2d__cell--soil.grid2d__cell--tilled,
.grid2d__cell--soil.grid2d__cell--seeded,
.grid2d__cell--soil.grid2d__cell--growing,
.grid2d__cell--soil.grid2d__cell--mature,
.grid2d__cell--soil.grid2d__cell--harvested {
  background: #b98a5e;
  border-color: #7a5636;
}

.grid2d__cell--wet {
  background: #6b4a32 !important;
  box-shadow: inset 0 0 0 3px #4185d6;
}

.grid2d__cell--obstacle {
  background: #8d9399;
}

.grid2d__cell--blocked {
  background: repeating-linear-gradient(45deg, #2f4a2c, #2f4a2c 6px, #3e5f3a 6px, #3e5f3a 12px);
}

.grid2d__cell--reservoir {
  background: #86b9f0;
}

.grid2d__cell--seedDepot {
  background: #e8dcc0;
}

.grid2d__cell--goal {
  outline: 3px dashed #f2c14e;
  outline-offset: -6px;
}

.grid2d__drop {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.55em;
}

.grid2d__robot {
  position: absolute;
  inset: 18%;
  display: grid;
  place-items: center;
  background: #f4f6f5;
  color: #1b2730;
  border: 3px solid #46e3ff;
  border-radius: 30%;
  font-size: 0.7em;
  transition: transform var(--duration-base) ease;
}

.grid2d__robot--failed {
  border-color: #e5484d;
  animation: grid2d-shake 300ms ease 2;
}

@keyframes grid2d-shake {
  25% {
    translate: -3px 0;
  }
  75% {
    translate: 3px 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .grid2d__robot--failed {
    animation: none;
  }
}
```

- [ ] **Step 5: Criar stub `src/render/farm3d/FarmScene.tsx`**

```tsx
import type { FarmSceneProps } from '@/render/FarmView'

export default function FarmScene(props: FarmSceneProps) {
  return <div aria-hidden="true" data-robot-x={props.state.robot.x} />
}
```

- [ ] **Step 6: Implementar `src/render/FarmView.tsx`**

```tsx
import { lazy, Suspense, useMemo, useState } from 'react'
import type { CellRef } from '@/game/missions/goals'
import type { GameEvent, GameState } from '@/game/world/types'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { describeRobot } from '@/render/cellDescription'
import { Grid2D } from '@/render/grid2d/Grid2D'
import { hasWebGL } from '@/render/hasWebGL'
import { useSettingsStore } from '@/stores/settingsStore'
import './FarmView.css'

const FarmScene = lazy(() => import('@/render/farm3d/FarmScene'))

export interface FarmSceneProps {
  state: GameState
  lastEvents: GameEvent[]
  eventKey: number
  stepDurationMs: number
  highlightCells: CellRef[]
  failed: boolean
  seedKey: string
  quarterTurns: number
  zoomLevel: number
  lowGraphics: boolean
  reducedMotion: boolean
  showcase?: boolean
}

interface FarmViewProps {
  state: GameState
  lastEvents: GameEvent[]
  eventKey: number
  stepDurationMs: number
  highlightCells: CellRef[]
  failed: boolean
  seedKey: string
}

const ZOOM_LEVELS = [0.7, 0.85, 1, 1.25, 1.5]

export function FarmView(props: FarmViewProps) {
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const reducedMotion = useReducedMotion()
  const webgl = useMemo(() => hasWebGL(), [])
  const [quarterTurns, setQuarterTurns] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(2)
  const [showLegend, setShowLegend] = useState(false)
  const use3d = renderMode !== '2d' && webgl
  const missingWebgl = renderMode !== '2d' && !webgl

  return (
    <section className="farm-view" aria-label="Fazenda">
      <div className="farm-view__toolbar">
        {use3d && (
          <>
            <button type="button" className="farm-view__tool" onClick={() => setQuarterTurns((turns) => turns - 1)} aria-label="Girar câmera para a esquerda">
              ↺
            </button>
            <button type="button" className="farm-view__tool" onClick={() => setQuarterTurns((turns) => turns + 1)} aria-label="Girar câmera para a direita">
              ↻
            </button>
            <button type="button" className="farm-view__tool" onClick={() => setZoomIndex((index) => Math.max(0, index - 1))} aria-label="Afastar câmera" disabled={zoomIndex === 0}>
              −
            </button>
            <button type="button" className="farm-view__tool" onClick={() => setZoomIndex((index) => Math.min(ZOOM_LEVELS.length - 1, index + 1))} aria-label="Aproximar câmera" disabled={zoomIndex === ZOOM_LEVELS.length - 1}>
              +
            </button>
          </>
        )}
        <button type="button" className="farm-view__tool farm-view__tool--wide" aria-expanded={showLegend} onClick={() => setShowLegend((value) => !value)}>
          Legenda
        </button>
      </div>

      {missingWebgl && (
        <p className="farm-view__notice" role="note">
          A visualização 3D não está disponível neste navegador. Mostrando a fazenda em 2D.
        </p>
      )}

      <div className="farm-view__stage">
        {use3d ? (
          <Suspense fallback={<div className="farm-view__loading">Carregando fazenda 3D…</div>}>
            <FarmScene
              {...props}
              quarterTurns={quarterTurns}
              zoomLevel={ZOOM_LEVELS[zoomIndex]}
              lowGraphics={lowGraphics}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        ) : (
          <Grid2D state={props.state} highlightCells={props.highlightCells} failed={props.failed} />
        )}
      </div>

      {showLegend && (
        <ul className="farm-view__legend">
          <li><span className="legend-swatch legend-swatch--untilled" />Solo sem preparo</li>
          <li><span className="legend-swatch legend-swatch--tilled" />Solo preparado (sulcos)</li>
          <li><span className="legend-swatch legend-swatch--seeded" />Semente plantada</li>
          <li><span className="legend-swatch legend-swatch--growing" />Planta em crescimento</li>
          <li><span className="legend-swatch legend-swatch--mature" />Planta madura (com frutos)</li>
          <li><span className="legend-swatch legend-swatch--wet" />Solo molhado (gota azul)</li>
          <li><span className="legend-swatch legend-swatch--obstacle" />Pedra / área bloqueada</li>
          <li><span className="legend-swatch legend-swatch--reservoir" />Reservatório de água</li>
          <li><span className="legend-swatch legend-swatch--depot" />Depósito de sementes</li>
          <li><span className="legend-swatch legend-swatch--goal" />Canteiro do objetivo</li>
        </ul>
      )}

      <p className="visually-hidden" aria-live="polite">
        {describeRobot(props.state)}
      </p>
    </section>
  )
}
```

- [ ] **Step 7: Criar `src/render/FarmView.css`**

```css
.farm-view {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 320px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #a8d8ea;
}

.farm-view__toolbar {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  z-index: 2;
  display: flex;
  gap: var(--space-1);
}

.farm-view__tool {
  min-width: var(--tap-size);
  min-height: var(--tap-size);
  border: none;
  border-radius: var(--radius-md);
  background: rgb(21 34 28 / 0.75);
  color: #fff;
  font: inherit;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
}

.farm-view__tool--wide {
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}

.farm-view__tool:disabled {
  opacity: 0.4;
}

.farm-view__notice {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  padding-left: 180px;
  background: var(--color-accent);
  color: #1d1a0e;
  font-size: var(--text-sm);
}

.farm-view__stage {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: stretch;
}

.farm-view__stage > .grid2d {
  margin: auto;
  width: min(100%, 720px);
}

.farm-view__loading {
  display: grid;
  place-items: center;
  color: var(--green-900);
  font-weight: 600;
}

.farm-view__legend {
  position: absolute;
  right: var(--space-2);
  top: var(--space-2);
  z-index: 2;
  margin: 0;
  padding: var(--space-3);
  list-style: none;
  display: grid;
  gap: var(--space-1);
  font-size: var(--text-xs);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.farm-view__legend li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgb(0 0 0 / 0.2);
}

.legend-swatch--untilled { background: #a7915f; }
.legend-swatch--tilled { background: repeating-linear-gradient(90deg, #9c6d47, #9c6d47 3px, #7a5636 3px, #7a5636 5px); }
.legend-swatch--seeded { background: radial-gradient(circle, #86cf5f 30%, #b98a5e 32%); }
.legend-swatch--growing { background: #45a04a; }
.legend-swatch--mature { background: radial-gradient(circle, #e2533b 35%, #2f7a37 37%); }
.legend-swatch--wet { background: #6b4a32; box-shadow: inset 0 0 0 2px #4185d6; }
.legend-swatch--obstacle { background: #8d9399; }
.legend-swatch--reservoir { background: #4185d6; }
.legend-swatch--depot { background: #c99a5b; }
.legend-swatch--goal { background: transparent; border: 2px dashed #f2c14e; }
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run src/render && npm run typecheck`
Expected: PASS (jsdom não tem WebGL → cai no 2D).

- [ ] **Step 9: Commit**

```bash
git add src/render
git commit -m "feat(render): add 2D fallback grid and farm view with camera toolbar"
```

---

### Task 7.3: Cena 3D low-poly

**Files:**
- Create: `src/render/farm3d/materials.tsx`
- Create: `src/render/farm3d/CameraRig.tsx`
- Create: `src/render/farm3d/PlantModel.tsx`
- Create: `src/render/farm3d/PlotTile.tsx`
- Create: `src/render/farm3d/RobotModel.tsx`
- Create: `src/render/farm3d/Decorations.tsx`
- Create: `src/render/farm3d/Effects.tsx`
- Modify (substituir stub): `src/render/farm3d/FarmScene.tsx`

**Interfaces:**
- Consumes: `FarmSceneProps`, `PALETTE`, `cellToWorld`, `FACING_YAW`, `generateDecorations`, `Decoration`, `Cell`, `Robot`, `GameEvent`.
- Produces: `default export FarmScene(props: FarmSceneProps)`; também exporta `Tree`, `Barn`, `Windmill`, `RobotBody` para reuso nas cenas de início, mapa de missões e resultado (Fase 9).

Regras de animação: toda animação parte do estado **já aplicado** (posição alvo = estado atual); duração = `stepDurationMs` (0 com `reducedMotion`). Efeitos (água, colheita, plantio) só nascem de `lastEvents` do passo corrente, identificados por `eventKey`.

- [ ] **Step 1: Criar `src/render/farm3d/materials.tsx`**

```tsx
interface FlatProps {
  color: string
  emissive?: string
  emissiveIntensity?: number
  transparent?: boolean
  opacity?: number
}

export function Flat({ color, emissive, emissiveIntensity, transparent, opacity }: FlatProps) {
  return (
    <meshStandardMaterial
      color={color}
      flatShading
      roughness={0.85}
      metalness={0.02}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissiveIntensity ?? 0}
      transparent={transparent}
      opacity={opacity ?? 1}
    />
  )
}
```

- [ ] **Step 2: Criar `src/render/farm3d/CameraRig.tsx`**

```tsx
import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrthographicCamera } from 'three'

interface CameraRigProps {
  gridWidth: number
  gridHeight: number
  quarterTurns: number
  zoomLevel: number
  showcase: boolean
  reducedMotion: boolean
}

const DISTANCE = 24

export function CameraRig({ gridWidth, gridHeight, quarterTurns, zoomLevel, showcase, reducedMotion }: CameraRigProps) {
  const camera = useThree((three) => three.camera) as OrthographicCamera
  const size = useThree((three) => three.size)

  useEffect(() => {
    const extent = Math.max(gridWidth, gridHeight) + 5
    camera.zoom = (Math.min(size.width, size.height) / extent) * zoomLevel * 0.95
    camera.updateProjectionMatrix()
  }, [camera, size, gridWidth, gridHeight, zoomLevel])

  useFrame((three) => {
    const spin = showcase && !reducedMotion ? three.clock.elapsedTime * 0.05 : 0
    const angle = Math.PI / 4 + quarterTurns * (Math.PI / 2) + spin
    camera.position.set(Math.sin(angle) * DISTANCE, DISTANCE * 0.82, Math.cos(angle) * DISTANCE)
    camera.lookAt(0, 0, 0)
  })

  return null
}
```

- [ ] **Step 3: Criar `src/render/farm3d/PlantModel.tsx`**

```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { PALETTE } from '@/render/palette'
import { Flat } from '@/render/farm3d/materials'

interface PlantModelProps {
  stage: 'seeded' | 'growing' | 'mature' | 'harvested'
  reducedMotion: boolean
}

function useGrowIn(reducedMotion: boolean) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    const group = ref.current
    if (!group) return
    const next = reducedMotion ? 1 : Math.min(1, group.scale.x + delta * 3)
    group.scale.setScalar(next)
  })
  return ref
}

export function PlantModel({ stage, reducedMotion }: PlantModelProps) {
  const ref = useGrowIn(reducedMotion)
  return (
    <group ref={ref} scale={reducedMotion ? 1 : 0.2}>
      {stage === 'seeded' && (
        <>
          <mesh position={[0, 0.03, 0]} castShadow>
            <sphereGeometry args={[0.12, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Flat color={PALETTE.soilTilled} />
          </mesh>
          <mesh position={[0, 0.1, 0]} castShadow>
            <coneGeometry args={[0.05, 0.12, 4]} />
            <Flat color={PALETTE.sprout} />
          </mesh>
        </>
      )}
      {stage === 'growing' && (
        <>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.02, 0.025, 0.24, 5]} />
            <Flat color={PALETTE.leafDark} />
          </mesh>
          {[0, 1, 2].map((index) => (
            <mesh
              key={index}
              position={[Math.cos((index * Math.PI * 2) / 3) * 0.09, 0.18 + index * 0.03, Math.sin((index * Math.PI * 2) / 3) * 0.09]}
              rotation={[0.6, (index * Math.PI * 2) / 3, 0]}
              castShadow
            >
              <coneGeometry args={[0.07, 0.18, 4]} />
              <Flat color={PALETTE.leaf} />
            </mesh>
          ))}
        </>
      )}
      {stage === 'mature' && (
        <>
          <mesh position={[0, 0.24, 0]} castShadow>
            <icosahedronGeometry args={[0.24, 0]} />
            <Flat color={PALETTE.leaf} />
          </mesh>
          <mesh position={[0.08, 0.36, -0.05]} castShadow>
            <icosahedronGeometry args={[0.15, 0]} />
            <Flat color={PALETTE.leafDark} />
          </mesh>
          {[
            [0.17, 0.2, 0.1],
            [-0.15, 0.24, 0.12],
            [0.02, 0.18, -0.2],
          ].map(([x, y, z], index) => (
            <mesh key={index} position={[x, y, z]} castShadow>
              <icosahedronGeometry args={[0.075, 1]} />
              <Flat color={index === 1 ? PALETTE.fruitAlt : PALETTE.fruit} />
            </mesh>
          ))}
        </>
      )}
      {stage === 'harvested' &&
        [-0.18, 0, 0.18].map((x, index) => (
          <mesh key={index} position={[x, 0.05, (index - 1) * 0.12]} rotation={[0, index, 0.3]}>
            <cylinderGeometry args={[0.015, 0.02, 0.12, 4]} />
            <Flat color={PALETTE.straw} />
          </mesh>
        ))}
    </group>
  )
}
```

- [ ] **Step 4: Criar `src/render/farm3d/PlotTile.tsx`**

```tsx
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
```

- [ ] **Step 5: Criar `src/render/farm3d/RobotModel.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { PALETTE } from '@/render/palette'
import { Flat } from '@/render/farm3d/materials'
import { cellToWorld, FACING_YAW } from '@/render/sceneLayout'
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

interface RobotModelProps {
  robot: Robot
  gridWidth: number
  gridHeight: number
  durationMs: number
  failed: boolean
}

function shortestAngle(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2)
  if (diff > Math.PI) diff -= Math.PI * 2
  if (diff < -Math.PI) diff += Math.PI * 2
  return from + diff
}

export function RobotModel({ robot, gridWidth, gridHeight, durationMs, failed }: RobotModelProps) {
  const ref = useRef<Group>(null)
  const target = cellToWorld(robot.x, robot.y, gridWidth, gridHeight)
  const motion = useRef({
    fromX: target.x,
    fromZ: target.z,
    fromYaw: FACING_YAW[robot.facing],
    toX: target.x,
    toZ: target.z,
    toYaw: FACING_YAW[robot.facing],
    start: 0,
  })

  useEffect(() => {
    const group = ref.current
    const current = motion.current
    const fromYaw = group ? group.rotation.y : current.toYaw
    current.fromX = group ? group.position.x : current.toX
    current.fromZ = group ? group.position.z : current.toZ
    current.fromYaw = fromYaw
    current.toX = target.x
    current.toZ = target.z
    current.toYaw = shortestAngle(fromYaw, FACING_YAW[robot.facing])
    current.start = performance.now()
  }, [target.x, target.z, robot.facing])

  useFrame((three) => {
    const group = ref.current
    if (!group) return
    const current = motion.current
    const progress = durationMs <= 0 ? 1 : Math.min(1, (performance.now() - current.start) / durationMs)
    const eased = 1 - (1 - progress) * (1 - progress)
    group.position.x = current.fromX + (current.toX - current.fromX) * eased
    group.position.z = current.fromZ + (current.toZ - current.fromZ) * eased
    group.position.y = 0.18 + (progress < 1 ? Math.sin(progress * Math.PI) * 0.06 : 0)
    group.rotation.y = current.fromYaw + (current.toYaw - current.fromYaw) * eased
    if (failed && durationMs > 0) group.position.x += Math.sin(three.clock.elapsedTime * 40) * 0.02
  })

  return (
    <group ref={ref} position={[target.x, 0.18, target.z]} rotation={[0, FACING_YAW[robot.facing], 0]}>
      <RobotBody failed={failed} />
      <mesh position={[0, 0.03, 0.62]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <circleGeometry args={[0.16, 3]} />
        <meshBasicMaterial color={PALETTE.arrow} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 6: Criar `src/render/farm3d/Decorations.tsx`**

```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { PALETTE } from '@/render/palette'
import { Flat } from '@/render/farm3d/materials'
import type { Decoration } from '@/render/sceneLayout'

const CANOPY = [PALETTE.leaf, PALETTE.grassDark, PALETTE.leafDark]

export function Tree({ variant = 0 }: { variant?: number }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 6]} />
        <Flat color={PALETTE.trunk} />
      </mesh>
      <mesh position={[0, 1.0, 0]} castShadow>
        <icosahedronGeometry args={[0.55, 0]} />
        <Flat color={CANOPY[variant % CANOPY.length]} />
      </mesh>
      <mesh position={[0.2, 1.35, 0.1]} castShadow>
        <icosahedronGeometry args={[0.32, 0]} />
        <Flat color={CANOPY[(variant + 1) % CANOPY.length]} />
      </mesh>
    </group>
  )
}

function Pine() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.5, 5]} />
        <Flat color={PALETTE.trunk} />
      </mesh>
      {[0.7, 1.05, 1.35].map((y, index) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <coneGeometry args={[0.5 - index * 0.12, 0.6, 6]} />
          <Flat color={PALETTE.leafDark} />
        </mesh>
      ))}
    </group>
  )
}

function Rock() {
  return (
    <mesh position={[0, 0.15, 0]} scale={[1, 0.6, 0.9]} castShadow>
      <dodecahedronGeometry args={[0.35, 0]} />
      <Flat color={PALETTE.rock} />
    </mesh>
  )
}

function Bush() {
  return (
    <mesh position={[0, 0.25, 0]} castShadow>
      <icosahedronGeometry args={[0.35, 0]} />
      <Flat color={PALETTE.bush} />
    </mesh>
  )
}

function Fence() {
  return (
    <group>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.44, 0.08]} />
          <Flat color={PALETTE.fence} />
        </mesh>
      ))}
      {[0.16, 0.32].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[1, 0.06, 0.04]} />
          <Flat color={PALETTE.fence} />
        </mesh>
      ))}
    </group>
  )
}

export function Barn() {
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.6, 1.8]} />
        <Flat color={PALETTE.barnRed} />
      </mesh>
      <mesh position={[0, 1.9, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1.3, 1]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 1.95, 3]} />
        <Flat color={PALETTE.roof} />
      </mesh>
      <mesh position={[1.11, 0.6, 0]}>
        <boxGeometry args={[0.02, 1.0, 0.8]} />
        <Flat color={PALETTE.barnTrim} />
      </mesh>
      <mesh position={[1.12, 0.6, 0]}>
        <boxGeometry args={[0.02, 0.86, 0.66]} />
        <Flat color={PALETTE.barnRed} />
      </mesh>
    </group>
  )
}

export function Windmill({ animate }: { animate: boolean }) {
  const blades = useRef<Group>(null)
  useFrame((_, delta) => {
    if (animate && blades.current) blades.current.rotation.z += delta * 0.8
  })
  return (
    <group>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.45, 2.8, 4]} />
        <Flat color={PALETTE.fence} />
      </mesh>
      <group ref={blades} position={[0, 2.8, 0.35]}>
        {[0, 1, 2, 3].map((index) => (
          <mesh key={index} rotation={[0, 0, (index * Math.PI) / 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.16, 1.5, 0.03]} />
            <Flat color={PALETTE.barnTrim} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Silo() {
  return (
    <group>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 2.2, 10]} />
        <Flat color={PALETTE.metal} />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[0.55, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Flat color={PALETTE.roof} />
      </mesh>
    </group>
  )
}

export function Decorations({ items, animate }: { items: Decoration[]; animate: boolean }) {
  return (
    <>
      {items.map((item, index) => (
        <group key={index} position={[item.x, 0, item.z]} rotation={[0, item.rotation, 0]} scale={item.scale}>
          {item.kind === 'tree' && <Tree variant={item.variant} />}
          {item.kind === 'pine' && <Pine />}
          {item.kind === 'rock' && <Rock />}
          {item.kind === 'bush' && <Bush />}
          {item.kind === 'fence' && <Fence />}
          {item.kind === 'barn' && <Barn />}
          {item.kind === 'windmill' && <Windmill animate={animate} />}
          {item.kind === 'silo' && <Silo />}
        </group>
      ))}
    </>
  )
}
```

- [ ] **Step 7: Criar `src/render/farm3d/Effects.tsx`**

```tsx
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { PALETTE } from '@/render/palette'
import { cellToWorld } from '@/render/sceneLayout'
import type { GameEvent } from '@/game/world/types'

interface EffectProps {
  x: number
  z: number
  durationMs: number
}

function useLifetime(durationMs: number) {
  const started = useRef(performance.now())
  const [alive, setAlive] = useState(true)
  const progress = () => Math.min(1, (performance.now() - started.current) / Math.max(durationMs, 1))
  useFrame(() => {
    if (alive && progress() >= 1) setAlive(false)
  })
  return { alive, progress }
}

function WaterSplash({ x, z, durationMs }: EffectProps) {
  const ref = useRef<Group>(null)
  const { alive, progress } = useLifetime(durationMs)
  useFrame(() => {
    if (ref.current) ref.current.position.y = 1.1 - progress() * 0.8
  })
  if (!alive) return null
  return (
    <group ref={ref} position={[x, 1.1, z]}>
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

function HarvestPop({ x, z, durationMs }: EffectProps) {
  const ref = useRef<Group>(null)
  const { alive, progress } = useLifetime(durationMs)
  useFrame(() => {
    if (!ref.current) return
    const value = progress()
    ref.current.position.y = 0.5 + value * 1.2
    ref.current.scale.setScalar(1 - value * 0.6)
  })
  if (!alive) return null
  return (
    <group ref={ref} position={[x, 0.5, z]}>
      <mesh>
        <icosahedronGeometry args={[0.14, 1]} />
        <meshBasicMaterial color={PALETTE.fruit} />
      </mesh>
    </group>
  )
}

function SeedPuff({ x, z, durationMs }: EffectProps) {
  const ref = useRef<Group>(null)
  const { alive, progress } = useLifetime(durationMs)
  useFrame(() => {
    if (ref.current) ref.current.scale.setScalar(0.4 + progress() * 1.2)
  })
  if (!alive) return null
  return (
    <group ref={ref} position={[x, 0.3, z]}>
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh key={index} position={[Math.cos(index * 1.25) * 0.2, 0.05, Math.sin(index * 1.25) * 0.2]}>
          <sphereGeometry args={[0.035, 5, 4]} />
          <meshBasicMaterial color={PALETTE.soilTilled} />
        </mesh>
      ))}
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
  const lifetime = Math.max(durationMs, 350)
  return (
    <>
      {events.map((event, index) => {
        const key = `${eventKey}-${index}`
        if (event.type === 'moistureChanged' && event.moisture === 'wet') {
          const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
          return <WaterSplash key={key} x={point.x} z={point.z} durationMs={lifetime} />
        }
        if (event.type === 'plotChanged' && event.to === 'harvested') {
          const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
          return <HarvestPop key={key} x={point.x} z={point.z} durationMs={lifetime} />
        }
        if (event.type === 'plotChanged' && (event.to === 'seeded' || event.to === 'tilled')) {
          const point = cellToWorld(event.x, event.y, gridWidth, gridHeight)
          return <SeedPuff key={key} x={point.x} z={point.z} durationMs={lifetime} />
        }
        return null
      })}
    </>
  )
}
```

- [ ] **Step 8: Substituir `src/render/farm3d/FarmScene.tsx` pela cena completa**

```tsx
import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import type { FarmSceneProps } from '@/render/FarmView'
import { PALETTE } from '@/render/palette'
import { cellToWorld, generateDecorations } from '@/render/sceneLayout'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { Decorations } from '@/render/farm3d/Decorations'
import { EffectsLayer } from '@/render/farm3d/Effects'
import { Flat } from '@/render/farm3d/materials'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { RobotModel } from '@/render/farm3d/RobotModel'

export default function FarmScene({
  state,
  lastEvents,
  eventKey,
  stepDurationMs,
  highlightCells,
  failed,
  seedKey,
  quarterTurns,
  zoomLevel,
  lowGraphics,
  reducedMotion,
  showcase = false,
}: FarmSceneProps) {
  const { width, height } = state
  const decorations = useMemo(
    () => generateDecorations(width, height, seedKey, { dense: !lowGraphics }),
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
      />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.5}
        castShadow={!lowGraphics}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[width + 18, 0.1, height + 16]} />
        <Flat color={PALETTE.grassLight} />
      </mesh>
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[width + 0.6, 0.06, height + 0.6]} />
        <Flat color={PALETTE.grassDark} />
      </mesh>
      <Decorations items={decorations} animate={!reducedMotion} />
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
      <RobotModel robot={state.robot} gridWidth={width} gridHeight={height} durationMs={duration} failed={failed} />
      {!lowGraphics && !reducedMotion && (
        <EffectsLayer events={lastEvents} eventKey={eventKey} gridWidth={width} gridHeight={height} durationMs={stepDurationMs} />
      )}
    </Canvas>
  )
}
```

- [ ] **Step 9: Typecheck, testes e verificação visual**

Run: `npm run typecheck && npx vitest run`
Expected: PASS.

Verificação visual (obrigatória para esta task): crie temporariamente `src/render/DevPreview.tsx` **fora do commit** ou use a página de gameplay quando a Fase 8 existir. Para checar agora: `npm run dev`, adicione temporariamente a rota `{ path: '/dev-farm', element: <FarmView state={createInitialState(MISSIONS[4])} lastEvents={[]} eventKey={0} stepDurationMs={500} highlightCells={[]} failed={false} seedKey="dev" /> }` em `src/app/routes.tsx`, abra `http://localhost:5173/#/dev-farm` e compare com a imagem de referência (canteiros com moldura, plantas com frutos, robô branco com visor escuro, árvores/cercas/celeiro/moinho/silo, céu claro). Remova a rota temporária antes do commit.

- [ ] **Step 10: Commit**

```bash
git add src/render
git commit -m "feat(render): add low-poly 3D farm scene with event-driven animations"
```
