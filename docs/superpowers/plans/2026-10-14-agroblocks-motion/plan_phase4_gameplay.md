# AgroBlocks Motion — Fase 4: HUD, controles e feedback no gameplay

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HUD com números em odômetro, piscadas de ganho/gasto, alerta de recurso baixo e colheita voando até o contador; painel de execução com troca de ícone, pílulas de velocidade e tremida no erro; console, dicas, tutorial e celebração animados; bloco em execução com halo e bloco com erro tremendo no Blockly.

**Architecture:** Funções puras (`resourceLevel`, `resourceMaxima`, `arcKeyframes`) e um registro de localização de células (`cellLocator`) permitem que o gameplay descubra onde o canteiro colhido está na tela, tanto no 2D quanto no 3D. Voos de colheita vivem numa store Zustand e são desenhados por um overlay em portal. Animações imperativas usam `useAnimate`/`animate` com os presets de `src/motion/`.

**Tech Stack:** `motion/react`, `motion`, Zustand, R3F, Blockly 13, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-motion-assets-design.md` (seção 4)

Leia `plan_index.md` antes de começar.

---

### Task 4.1: Lógica de recursos, arco de voo, localizador de células e store de voos

**Files:**
- Create: `src/features/gameplay/hudLogic.ts`, `src/render/cellLocator.ts`, `src/stores/flightStore.ts`
- Test: `src/features/gameplay/hudLogic.test.ts`, `src/render/cellLocator.test.ts`, `src/stores/flightStore.test.ts`

**Interfaces:**
- Consumes: `MissionDefinition`.
- Produces:
  - `type ResourceLevel = 'ok' | 'low' | 'empty'`, `resourceLevel(value: number | null, max: number | null): ResourceLevel`
  - `resourceMaxima(mission: MissionDefinition): { seeds: number | null; water: number | null; energy: number | null }`
  - `interface Point { x: number; y: number }`, `arcKeyframes(from: Point, to: Point, lift?: number): { x: number[]; y: number[] }` (deslocamentos relativos a `from`)
  - `registerCellLocator(locator: (x: number, y: number) => Point | null): () => void`, `locateCell(x: number, y: number): Point | null`
  - `useFlightStore` com `{ flights: Flight[]; arrivals: number; launch(from: Point, to: Point): void; land(id: number): void }`, `interface Flight { id: number; from: Point; to: Point }`

- [ ] **Step 1: Escrever testes que falham**

`src/features/gameplay/hudLogic.test.ts`:
```ts
import { arcKeyframes, resourceLevel, resourceMaxima } from '@/features/gameplay/hudLogic'
import { getMission } from '@/data/missions'

describe('hudLogic', () => {
  it('classifies resource levels', () => {
    expect(resourceLevel(null, 10)).toBe('ok')
    expect(resourceLevel(5, null)).toBe('ok')
    expect(resourceLevel(0, 10)).toBe('empty')
    expect(resourceLevel(2, 10)).toBe('low')
    expect(resourceLevel(3, 10)).toBe('ok')
  })

  it('derives maxima from capacities and initial values', () => {
    const fifth = getMission('m5-limited-resources')
    const sixth = getMission('m6-efficient-farm')
    if (!fifth || !sixth) throw new Error('missing')
    expect(resourceMaxima(fifth)).toEqual({ seeds: 6, water: 3, energy: null })
    expect(resourceMaxima(sixth)).toEqual({ seeds: 16, water: 16, energy: 70 })
  })

  it('builds an arc that ends at the target and rises in the middle', () => {
    const arc = arcKeyframes({ x: 100, y: 400 }, { x: 900, y: 40 }, 120)
    expect(arc.x).toEqual([0, 400, 800])
    expect(arc.y[0]).toBe(0)
    expect(arc.y[2]).toBe(-360)
    expect(arc.y[1]).toBe(-300)
  })
})
```

`src/render/cellLocator.test.ts`:
```ts
import { locateCell, registerCellLocator } from '@/render/cellLocator'

describe('cellLocator', () => {
  it('returns null without a registered view', () => {
    expect(locateCell(0, 0)).toBeNull()
  })

  it('uses the latest registered locator and unregisters cleanly', () => {
    const first = registerCellLocator((x, y) => ({ x: x * 10, y: y * 10 }))
    expect(locateCell(2, 3)).toEqual({ x: 20, y: 30 })
    const second = registerCellLocator(() => ({ x: 1, y: 1 }))
    first()
    expect(locateCell(2, 3)).toEqual({ x: 1, y: 1 })
    second()
    expect(locateCell(2, 3)).toBeNull()
  })
})
```

`src/stores/flightStore.test.ts`:
```ts
import { useFlightStore } from '@/stores/flightStore'

describe('flightStore', () => {
  it('launches and lands flights, counting arrivals', () => {
    useFlightStore.getState().launch({ x: 0, y: 0 }, { x: 10, y: 10 })
    const [flight] = useFlightStore.getState().flights
    expect(flight.to).toEqual({ x: 10, y: 10 })
    useFlightStore.getState().land(flight.id)
    expect(useFlightStore.getState().flights).toEqual([])
    expect(useFlightStore.getState().arrivals).toBe(1)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/gameplay/hudLogic.test.ts src/render/cellLocator.test.ts src/stores/flightStore.test.ts`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/features/gameplay/hudLogic.ts`**

```ts
import type { MissionDefinition } from '@/game/missions/missionTypes'

export type ResourceLevel = 'ok' | 'low' | 'empty'

export interface Point {
  x: number
  y: number
}

export function resourceLevel(value: number | null, max: number | null): ResourceLevel {
  if (value === null || max === null || max <= 0) return 'ok'
  if (value <= 0) return 'empty'
  return value / max <= 0.2 ? 'low' : 'ok'
}

export function resourceMaxima(mission: MissionDefinition): { seeds: number | null; water: number | null; energy: number | null } {
  const { resources } = mission
  return {
    seeds: resources.seedCapacity ?? resources.seeds,
    water: resources.waterCapacity ?? resources.water,
    energy: resources.energy,
  }
}

export function arcKeyframes(from: Point, to: Point, lift = 120): { x: number[]; y: number[] } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  return { x: [0, dx / 2, dx], y: [0, Math.min(0, dy) / 2 - lift, dy] }
}
```

- [ ] **Step 4: Implementar `src/render/cellLocator.ts`**

```ts
import type { Point } from '@/features/gameplay/hudLogic'

type Locator = (x: number, y: number) => Point | null

let current: Locator | null = null

export function registerCellLocator(locator: Locator): () => void {
  current = locator
  return () => {
    if (current === locator) current = null
  }
}

export function locateCell(x: number, y: number): Point | null {
  return current ? current(x, y) : null
}
```

- [ ] **Step 5: Implementar `src/stores/flightStore.ts`**

```ts
import { create } from 'zustand'
import type { Point } from '@/features/gameplay/hudLogic'

export interface Flight {
  id: number
  from: Point
  to: Point
}

interface FlightState {
  flights: Flight[]
  arrivals: number
  launch: (from: Point, to: Point) => void
  land: (id: number) => void
}

let nextFlightId = 1

export const useFlightStore = create<FlightState>((set) => ({
  flights: [],
  arrivals: 0,
  launch: (from, to) => {
    const id = nextFlightId
    nextFlightId += 1
    set((state) => ({ flights: [...state.flights, { id, from, to }] }))
  },
  land: (id) => set((state) => ({ flights: state.flights.filter((flight) => flight.id !== id), arrivals: state.arrivals + 1 })),
}))
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/features/gameplay/hudLogic.test.ts src/render/cellLocator.test.ts src/stores/flightStore.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/gameplay/hudLogic.ts src/features/gameplay/hudLogic.test.ts src/render/cellLocator.ts src/render/cellLocator.test.ts src/stores/flightStore.ts src/stores/flightStore.test.ts
git commit -m "feat(gameplay): add resource levels, harvest arc, cell locator and flight store"
```

---

### Task 4.2: HUD animado e voo da colheita

**Files:**
- Create: `src/components/game/RollingNumber.tsx`, `src/features/gameplay/components/HarvestFlights.tsx`
- Modify (substituir): `src/features/gameplay/components/GameHud.tsx`
- Modify: `src/features/gameplay/components/panels.css`, `src/render/grid2d/Grid2D.tsx`, `src/render/farm3d/FarmScene.tsx`
- Create: `src/render/farm3d/CellLocatorBridge.tsx`
- Test: `src/features/gameplay/components/hud.test.tsx`

**Interfaces:**
- Consumes: Task 4.1, `GameButton`, `Logo`, `Icon`, `formatResource`, presets.
- Produces:
  - `RollingNumber({ value: string })` — dígitos rolam (odômetro); texto acessível com o valor
  - `GameHud({ mission, resources, onHelp, onSettings, onExit })` — o chip de colheita tem `data-flight-target="harvest"`; cada chip tem `data-level`
  - `HarvestFlights()` — portal que desenha os voos e chama `land` no fim
  - `CellLocatorBridge({ width, height })` — dentro do `Canvas`, registra o localizador 3D
  - `Grid2D` passa a marcar células com `data-cell="x,y"` e registrar o localizador 2D

- [ ] **Step 1: Escrever teste que falha `src/features/gameplay/components/hud.test.tsx`**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { RollingNumber } from '@/components/game/RollingNumber'
import { GameHud } from '@/features/gameplay/components/GameHud'
import { HarvestFlights } from '@/features/gameplay/components/HarvestFlights'
import { getMission } from '@/data/missions'
import { useFlightStore } from '@/stores/flightStore'
import { locateCell } from '@/render/cellLocator'
import { Grid2D } from '@/render/grid2d/Grid2D'
import { makeState } from '@/game/testing/makeState'

const mission = getMission('m5-limited-resources')
if (!mission) throw new Error('missing')

describe('animated HUD', () => {
  it('exposes the real value of a rolling number to assistive tech', () => {
    const { container } = render(<RollingNumber value="12" />)
    expect(container.querySelector('.visually-hidden')).toHaveTextContent('12')
    expect(container.querySelectorAll('.rolling-number__column')).toHaveLength(2)
  })

  it('marks low and empty resources', () => {
    render(<GameHud mission={mission} resources={{ seeds: 1, water: 0, energy: null, harvested: 0 }} onHelp={vi.fn()} onSettings={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByLabelText('Sementes: 1')).toHaveAttribute('data-level', 'low')
    expect(screen.getByLabelText('Água: 0')).toHaveAttribute('data-level', 'empty')
    expect(screen.getByLabelText('Energia: ilimitada')).toHaveAttribute('data-level', 'ok')
    expect(screen.getByLabelText('Colheita: 0')).toHaveAttribute('data-flight-target', 'harvest')
  })

  it('flies harvested fruit and lands it', async () => {
    render(<HarvestFlights />)
    act(() => useFlightStore.getState().launch({ x: 10, y: 10 }, { x: 200, y: 20 }))
    expect(document.querySelectorAll('.harvest-flight')).toHaveLength(1)
    const before = useFlightStore.getState().arrivals
    await waitFor(() => expect(useFlightStore.getState().arrivals).toBe(before + 1), { timeout: 3000 })
    expect(document.querySelectorAll('.harvest-flight')).toHaveLength(0)
  })

  it('registers the 2D grid as the cell locator', () => {
    const { unmount } = render(<Grid2D state={makeState(['. .'])} highlightCells={[]} failed={false} />)
    expect(locateCell(1, 0)).not.toBeNull()
    unmount()
    expect(locateCell(1, 0)).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/gameplay/components/hud.test.tsx`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/components/game/RollingNumber.tsx`**

```tsx
import { motion } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export function RollingNumber({ value }: { value: string }) {
  const characters = [...value]
  return (
    <span className="rolling-number">
      <span className="visually-hidden">{value}</span>
      <span className="rolling-number__digits" aria-hidden="true">
        {characters.map((character, index) => {
          const key = characters.length - index
          if (!/\d/.test(character)) return <span key={`c-${key}`}>{character}</span>
          return (
            <span key={`d-${key}`} className="rolling-number__column">
              <motion.span
                className="rolling-number__strip"
                initial={false}
                animate={{ y: `${-Number(character)}em` }}
                transition={{ duration: DURATIONS.odometer, ease: EASINGS.easeOutCubic }}
              >
                {DIGITS.map((digit) => (
                  <span key={digit}>{digit}</span>
                ))}
              </motion.span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
```

- [ ] **Step 4: Substituir `src/features/gameplay/components/GameHud.tsx`**

```tsx
import { useEffect, useMemo, useRef } from 'react'
import { motion, useAnimate } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { RollingNumber } from '@/components/game/RollingNumber'
import { Icon, type IconName } from '@/components/icons/Icon'
import { Logo } from '@/components/brand/Logo'
import { formatResource } from '@/features/gameplay/gameplayLogic'
import { resourceLevel, resourceMaxima } from '@/features/gameplay/hudLogic'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { Resources } from '@/game/world/types'
import { EASINGS } from '@/motion/easings'
import { BADGE_POP, DURATIONS, ERROR_SHAKE } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { useFlightStore } from '@/stores/flightStore'
import './panels.css'

interface ResourceChipProps {
  icon: IconName
  label: string
  value: number | null
  max: number | null
  tone: string
  flightTarget?: boolean
  popKey?: number
}

const GAIN = 'rgba(124, 207, 106, 0.55)'
const LOSS = 'rgba(229, 72, 77, 0.55)'
const REST = 'rgba(30, 49, 40, 1)'

function ResourceChip({ icon, label, value, max, tone, flightTarget = false, popKey = 0 }: ResourceChipProps) {
  const { ambient } = useMotionPrefs()
  const [scope, animateChip] = useAnimate<HTMLDivElement>()
  const previous = useRef(value)
  const text = formatResource(value)
  const spoken = value === null ? `${label}: ilimitada` : `${label}: ${text}`
  const level = resourceLevel(value, max)

  useEffect(() => {
    const before = previous.current
    previous.current = value
    if (!scope.current || before === null || value === null || before === value) return
    animateChip(scope.current, { backgroundColor: [value > before ? GAIN : LOSS, REST] }, { duration: DURATIONS.odometer, ease: EASINGS.easeOutCubic })
    if (resourceLevel(value, max) === 'empty') animateChip(scope.current, ERROR_SHAKE.keyframes, ERROR_SHAKE.options)
  }, [value, max, animateChip, scope])

  useEffect(() => {
    if (popKey > 0 && scope.current) animateChip(scope.current, BADGE_POP.keyframes, BADGE_POP.options)
  }, [popKey, animateChip, scope])

  return (
    <motion.div
      ref={scope}
      className={`resource-chip resource-chip--${tone}`}
      aria-label={spoken}
      role="group"
      data-level={level}
      data-flight-target={flightTarget ? 'harvest' : undefined}
      animate={
        level === 'low' && ambient
          ? { boxShadow: ['0 0 0 0 rgba(242,193,78,0.7)', '0 0 0 6px rgba(242,193,78,0)'] }
          : { boxShadow: '0 0 0 0 rgba(242,193,78,0)' }
      }
      transition={level === 'low' && ambient ? { duration: 1.2, repeat: Infinity, ease: EASINGS.easeInOutSine } : { duration: 0.2 }}
    >
      <Icon name={icon} size={22} />
      <span className="resource-chip__text" aria-hidden="true">
        <span className="resource-chip__label">{label}</span>
        <span className="resource-chip__value">
          <RollingNumber value={text} />
        </span>
      </span>
    </motion.div>
  )
}

interface GameHudProps {
  mission: MissionDefinition
  resources: Resources
  onHelp: () => void
  onSettings: () => void
  onExit: () => void
}

export function GameHud({ mission, resources, onHelp, onSettings, onExit }: GameHudProps) {
  const maxima = useMemo(() => resourceMaxima(mission), [mission])
  const arrivals = useFlightStore((store) => store.arrivals)
  return (
    <motion.header className="game-hud" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={SPRINGS.modal}>
      <Logo />
      <div className="game-hud__mission">
        <h1 className="game-hud__title">{mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`}</h1>
        <p className="game-hud__goal">{mission.briefing.goalText}</p>
      </div>
      <div className="game-hud__resources" aria-label="Recursos">
        <ResourceChip icon="seed" label="Sementes" value={resources.seeds} max={maxima.seeds} tone="seed" />
        <ResourceChip icon="drop" label="Água" value={resources.water} max={maxima.water} tone="water" />
        <ResourceChip icon="bolt" label="Energia" value={resources.energy} max={maxima.energy} tone="energy" />
        <ResourceChip icon="basket" label="Colheita" value={resources.harvested} max={null} tone="harvest" flightTarget popKey={arrivals} />
      </div>
      <div className="game-hud__actions">
        <GameButton tone="ghost" icon="help" className="hud-button" onClick={onHelp} aria-label="Ver objetivo e conceito da fase" />
        <GameButton tone="ghost" icon="gear" className="hud-button" onClick={onSettings} aria-label="Configurações" />
        <GameButton tone="danger" className="hud-button hud-button--exit" onClick={onExit}>
          Sair
        </GameButton>
      </div>
    </motion.header>
  )
}
```

- [ ] **Step 5: Implementar `src/features/gameplay/components/HarvestFlights.tsx`**

```tsx
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { arcKeyframes } from '@/features/gameplay/hudLogic'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { useFlightStore } from '@/stores/flightStore'

function Fruit() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <circle cx="12" cy="14" r="8" fill="#e2533b" />
      <path d="M12 6c-2-3-5-3-6-2 2 1 4 2 6 2zm0 0c2-3 5-3 6-2-2 1-4 2-6 2z" fill="#3fa34d" />
      <circle cx="9" cy="11" r="2" fill="#ffffff" opacity="0.5" />
    </svg>
  )
}

export function HarvestFlights() {
  const flights = useFlightStore((store) => store.flights)
  const land = useFlightStore((store) => store.land)
  return createPortal(
    <div className="harvest-flights" aria-hidden="true">
      {flights.map((flight) => {
        const arc = arcKeyframes(flight.from, flight.to)
        return (
          <motion.span
            key={flight.id}
            className="harvest-flight"
            style={{ left: flight.from.x, top: flight.from.y }}
            initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
            animate={{ x: arc.x, y: arc.y, scale: [0.6, 1.3, 0.8], opacity: [1, 1, 0.9] }}
            transition={{ duration: DURATIONS.harvestFlight, ease: EASINGS.easeInQuad, times: [0, 0.5, 1] }}
            onAnimationComplete={() => land(flight.id)}
          >
            <Fruit />
          </motion.span>
        )
      })}
    </div>,
    document.body,
  )
}
```

- [ ] **Step 6: Registrar localizadores**

Em `src/render/grid2d/Grid2D.tsx`:
- Importar `useEffect, useRef` de `react` e `registerCellLocator` de `@/render/cellLocator`.
- Criar `const gridRef = useRef<HTMLDivElement>(null)` e, antes do `return`:
```tsx
  useEffect(() => {
    return registerCellLocator((x, y) => {
      const cell = gridRef.current?.querySelector<HTMLElement>(`[data-cell="${x},${y}"]`)
      if (!cell) return null
      const rect = cell.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    })
  }, [])
```
- Colocar `ref={gridRef}` no `div` com `role="grid"` e `data-cell={`${x},${y}`}` em cada `gridcell`.

Criar `src/render/farm3d/CellLocatorBridge.tsx`:
```tsx
import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { registerCellLocator } from '@/render/cellLocator'
import { cellToWorld } from '@/render/sceneLayout'

export function CellLocatorBridge({ width, height }: { width: number; height: number }) {
  const camera = useThree((three) => three.camera)
  const canvas = useThree((three) => three.gl.domElement)
  const point = useMemo(() => new Vector3(), [])

  useEffect(() => {
    return registerCellLocator((x, y) => {
      const world = cellToWorld(x, y, width, height)
      point.set(world.x, 0.4, world.z).project(camera)
      const rect = canvas.getBoundingClientRect()
      return { x: rect.left + ((point.x + 1) / 2) * rect.width, y: rect.top + ((1 - point.y) / 2) * rect.height }
    })
  }, [camera, canvas, point, width, height])

  return null
}
```
Em `src/render/farm3d/FarmScene.tsx`, importar e renderizar `<CellLocatorBridge width={width} height={height} />` logo após `<CameraRig ... />`.

- [ ] **Step 7: Estilos em `src/features/gameplay/components/panels.css`**

Remover `.resource-chip__value` com `@keyframes chip-pop` e a regra `.hud-button` antiga; acrescentar:
```css
.resource-chip {
  background: rgba(30, 49, 40, 1);
}

.resource-chip[data-level='low'] {
  border-color: #e0a526;
}

.resource-chip[data-level='empty'] {
  border-color: #e5484d;
}

.resource-chip__value {
  font-weight: 800;
  color: var(--chrome-text);
}

.rolling-number__digits {
  display: inline-flex;
  font-variant-numeric: tabular-nums;
}

.rolling-number__column {
  display: inline-block;
  height: 1em;
  line-height: 1em;
  overflow: hidden;
}

.rolling-number__strip {
  display: flex;
  flex-direction: column;
}

.hud-button.game-button {
  min-height: var(--tap-size);
  padding: 0 var(--space-3);
  color: var(--chrome-text);
}

.hud-button--exit.game-button {
  min-width: 88px;
  color: #ffffff;
}

.harvest-flights {
  position: fixed;
  inset: 0;
  z-index: 95;
  pointer-events: none;
}

.harvest-flight {
  position: absolute;
  display: grid;
  margin: -14px 0 0 -14px;
  filter: drop-shadow(0 3px 0 rgb(0 0 0 / 0.25));
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run src/features/gameplay src/render && npm run typecheck`
Expected: PASS (inclui `components.test.tsx` antigo da HUD: "Sementes: 5", "Água: ilimitada", heading e "Sair").

- [ ] **Step 9: Commit**

```bash
git add src
git commit -m "feat(gameplay): add odometer HUD, resource alerts and harvest fruit flights"
```

---

### Task 4.3: Painel de execução, console, dicas e tutorial animados

**Files:**
- Modify (substituir): `src/features/gameplay/components/ExecutionPanel.tsx`, `src/features/gameplay/components/ConsolePanel.tsx`, `src/features/gameplay/components/HintsPanel.tsx`, `src/features/tutorial/TutorialOverlay.tsx`
- Modify: `src/features/gameplay/components/components.test.tsx`, `src/features/gameplay/components/panels.css`, `src/features/tutorial/TutorialOverlay.css`

**Interfaces:**
- Consumes: `GameButton`, `GameToggle`, `SPRINGS`, presets, `useMotionPrefs`.
- Produces: mesmas props de antes; velocidade vira `role="radiogroup"` "Velocidade" com `role="radio"` por opção (`0,5x`, `1x`, `2x`, `4x`); `HintsPanel` ganha prop opcional `attention?: boolean`.

- [ ] **Step 1: Atualizar o teste de velocidade (falha primeiro)**

Em `src/features/gameplay/components/components.test.tsx`, substituir o teste `'maps the speed slider to the four speeds'` por:
```tsx
  it('offers the four speeds as pills', () => {
    render(<ExecutionPanel {...panelProps} status="idle" />)
    const group = screen.getByRole('radiogroup', { name: 'Velocidade' })
    expect(within(group).getAllByRole('radio')).toHaveLength(4)
    expect(within(group).getByRole('radio', { name: '1x' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(within(group).getByRole('radio', { name: '4x' }))
    expect(panelProps.onSpeedChange).toHaveBeenCalledWith(4)
  })

  it('animates new console entries but not the ones already shown', () => {
    const { container, rerender } = render(<ConsolePanel entries={[{ id: 1, kind: 'info', text: 'A' }]} onClear={vi.fn()} />)
    expect(container.querySelector('[data-new="true"]')).toBeNull()
    rerender(<ConsolePanel entries={[{ id: 1, kind: 'info', text: 'A' }, { id: 2, kind: 'success', text: 'B' }]} onClear={vi.fn()} />)
    expect(container.querySelector('[data-new="true"]')).toHaveTextContent('B')
  })
```
e importar `within` de `@testing-library/react`.

Run: `npx vitest run src/features/gameplay/components/components.test.tsx`
Expected: FAIL — não existe `radiogroup` nem `data-new`.

- [ ] **Step 2: Substituir `src/features/gameplay/components/ExecutionPanel.tsx`**

```tsx
import { useEffect } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { GameToggle } from '@/components/game/GameToggle'
import { Icon, type IconName } from '@/components/icons/Icon'
import { STATUS_LABELS } from '@/features/gameplay/gameplayLogic'
import { SPEEDS, type ExecutionStatus, type Speed } from '@/game/execution/types'
import { ERROR_SHAKE, snapIn } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'

interface ExecutionPanelProps {
  status: ExecutionStatus
  speed: Speed
  stepMode: boolean
  actionCount: number
  currentLabel: string
  onRun: () => void
  onStep: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
  onSpeedChange: (speed: Speed) => void
  onStepModeChange: (enabled: boolean) => void
}

const STATUS_ICONS: Record<ExecutionStatus, string> = {
  idle: '●',
  running: '▶',
  paused: '❚❚',
  finished: '✓',
  failed: '✕',
}

function SwapIcon({ name }: { name: IconName }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={name}
        className="icon-swap"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 90, transition: { duration: 0.15 } }}
        transition={SPRINGS.snap}
      >
        <Icon name={name} />
      </motion.span>
    </AnimatePresence>
  )
}

export function ExecutionPanel(props: ExecutionPanelProps) {
  const { status, speed, stepMode, actionCount, currentLabel } = props
  const running = status === 'running'
  const paused = status === 'paused'
  const [scope, animatePanel] = useAnimate<HTMLElement>()

  useEffect(() => {
    if (status === 'failed' && scope.current) animatePanel(scope.current, ERROR_SHAKE.keyframes, ERROR_SHAKE.options)
  }, [status, animatePanel, scope])

  return (
    <section ref={scope} className="execution-panel" aria-labelledby="execution-title">
      <h2 id="execution-title" className="side-title">
        Execução
      </h2>
      <GameButton tone="primary" size="lg" className="execution-panel__main" onClick={stepMode ? props.onStep : props.onRun} disabled={running}>
        <SwapIcon name={stepMode ? 'step' : 'play'} />
        {stepMode ? 'Próximo passo' : 'Executar'}
      </GameButton>
      <GameButton tone="secondary" className="execution-panel__secondary" onClick={paused ? props.onResume : props.onPause} disabled={!running && !paused}>
        <SwapIcon name={paused ? 'play' : 'pause'} />
        {paused ? 'Continuar' : 'Pausar'}
      </GameButton>
      <GameToggle label="Passo a passo" checked={stepMode} onChange={props.onStepModeChange} />
      <div className="execution-panel__speed">
        <span id="speed-label">Velocidade</span>
        <div role="radiogroup" aria-labelledby="speed-label" className="speed-pills">
          {SPEEDS.map((option) => {
            const label = `${option.toLocaleString('pt-BR')}x`
            const checked = option === speed
            return (
              <button key={option} type="button" role="radio" aria-checked={checked} className="speed-pills__option" onClick={() => props.onSpeedChange(option)}>
                {checked && <motion.span layoutId="speed-indicator" className="speed-pills__indicator" transition={SPRINGS.pill} />}
                <span className="speed-pills__label">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="execution-panel__row">
        <GameButton tone="secondary" icon="stop" onClick={props.onStop} disabled={status === 'idle'}>
          Parar
        </GameButton>
        <GameButton tone="secondary" icon="reset" onClick={props.onReset}>
          Reiniciar
        </GameButton>
      </div>
      <dl className="execution-panel__status">
        <dt>Estado</dt>
        <dd className={`status status--${status}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={status} variants={snapIn} initial="hidden" animate="visible" exit="exit">
              <span aria-hidden="true">{STATUS_ICONS[status]}</span> {STATUS_LABELS[status]}
            </motion.span>
          </AnimatePresence>
        </dd>
        <dt>Comandos executados</dt>
        <dd>{actionCount}</dd>
        <dt>Bloco atual</dt>
        <dd>{currentLabel}</dd>
      </dl>
    </section>
  )
}
```

O teste antigo `'enables controls according to the execution status'` espera "Pausar" desabilitado em `idle` e "Continuar" em `paused` — mantido.

- [ ] **Step 3: Substituir `src/features/gameplay/components/ConsolePanel.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import type { ConsoleEntry, ConsoleKind } from '@/game/execution/types'
import { BADGE_POP, ERROR_SHAKE, toastItem } from '@/motion/presets'

const MARKERS: Record<ConsoleKind, string> = {
  info: 'ℹ',
  action: '▶',
  check: '?',
  error: '✕',
  success: '✓',
  warning: '⚠',
}

function emphasis(kind: ConsoleKind) {
  if (kind === 'error') return { animate: ERROR_SHAKE.keyframes, transition: ERROR_SHAKE.options }
  if (kind === 'success') return { animate: BADGE_POP.keyframes, transition: BADGE_POP.options }
  return null
}

export function ConsolePanel({ entries, onClear }: { entries: ConsoleEntry[]; onClear: () => void }) {
  const listRef = useRef<HTMLOListElement>(null)
  const initialIds = useRef(new Set(entries.map((entry) => entry.id)))

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [entries])

  return (
    <div className="console-panel">
      <div className="console-panel__header">
        <span className="side-subtitle">Console</span>
        <button type="button" className="icon-button" onClick={onClear} aria-label="Limpar console">
          <Icon name="trash" size={18} />
        </button>
      </div>
      <ol ref={listRef} role="log" aria-live="polite" className="console-panel__list">
        {entries.length === 0 && <li className="console-entry console-entry--info">Pronto para executar.</li>}
        {entries.map((entry) => {
          const isNew = !initialIds.current.has(entry.id)
          const extra = isNew ? emphasis(entry.kind) : null
          return (
            <motion.li
              key={entry.id}
              className={`console-entry console-entry--${entry.kind}`}
              data-new={isNew ? 'true' : undefined}
              variants={toastItem}
              initial={isNew ? 'hidden' : false}
              animate="visible"
            >
              <motion.span className="console-entry__inner" animate={extra?.animate} transition={extra?.transition}>
                <span aria-hidden="true">{MARKERS[entry.kind]}</span> {entry.text}
              </motion.span>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
```

- [ ] **Step 4: Substituir `src/features/gameplay/components/HintsPanel.tsx`**

```tsx
import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { Icon } from '@/components/icons/Icon'
import { HINT_LEVEL_LABELS } from '@/features/gameplay/gameplayLogic'
import { HEARTBEAT, rowExpand } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

interface HintsPanelProps {
  hints: [string, string, string, string]
  revealed: number
  canReveal: boolean
  failedAttempts: number
  onReveal: () => void
}

export function HintsPanel({ hints, revealed, canReveal, failedAttempts, onReveal }: HintsPanelProps) {
  const { ambient } = useMotionPrefs()
  const initiallyRevealed = useRef(revealed)
  const lockedLast = revealed === 3 && failedAttempts < 2
  const attention = canReveal && failedAttempts >= 2 && ambient
  return (
    <div className="hints-panel">
      <p className="hints-panel__intro">
        Tente primeiro sozinho. As dicas vão da ideia geral até um exemplo parcial e ficam registradas para o professor.
      </p>
      <ol className="hints-panel__list">
        {hints.slice(0, revealed).map((hint, index) => (
          <motion.li key={index} className="hint" variants={rowExpand} initial={index < initiallyRevealed.current ? false : 'hidden'} animate="visible">
            <strong>
              <Icon name="bulb" size={16} /> {HINT_LEVEL_LABELS[index]}
            </strong>
            <span>{hint}</span>
          </motion.li>
        ))}
      </ol>
      <motion.div animate={attention ? HEARTBEAT.keyframes : { scale: 1 }} transition={attention ? HEARTBEAT.options : { duration: 0.2 }}>
        <GameButton tone="accent" icon="bulb" onClick={onReveal} disabled={!canReveal}>
          Pedir dica ({revealed}/4)
        </GameButton>
      </motion.div>
      <AnimatePresence>
        {lockedLast && (
          <motion.p
            className="hints-panel__lock"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, rotate: -8, transition: { duration: 0.35 } }}
          >
            <Icon name="lock" size={16} /> O exemplo parcial libera depois de 2 tentativas sem sucesso.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 5: Substituir `src/features/tutorial/TutorialOverlay.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { advanceTutorial, statusSignal, TUTORIAL_STEPS, type TutorialSignal } from '@/features/tutorial/tutorialMachine'
import type { ExecutionSnapshot } from '@/game/execution/types'
import { EASINGS } from '@/motion/easings'
import { NUDGE, overshoot, PRESSABLE } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import './TutorialOverlay.css'

interface TutorialOverlayProps {
  snapshot: ExecutionSnapshot
  blockEvent: { kind: 'added' | 'removed'; id: number } | null
}

export function TutorialOverlay({ snapshot, blockEvent }: TutorialOverlayProps) {
  const { ambient } = useMotionPrefs()
  const [index, setIndex] = useState(0)
  const previousStatus = useRef(snapshot.status)
  const lastBlockEvent = useRef<number | null>(null)

  const signal = (value: TutorialSignal) => setIndex((current) => advanceTutorial(current, value))

  useEffect(() => {
    const derived = statusSignal(previousStatus.current, snapshot)
    previousStatus.current = snapshot.status
    if (derived) signal(derived)
  }, [snapshot])

  useEffect(() => {
    if (!blockEvent || lastBlockEvent.current === blockEvent.id) return
    lastBlockEvent.current = blockEvent.id
    signal(blockEvent.kind === 'added' ? 'blockAdded' : 'blockRemoved')
  }, [blockEvent])

  const done = index >= TUTORIAL_STEPS.length
  const step = done ? null : TUTORIAL_STEPS[index]

  return (
    <AnimatePresence mode="wait">
      {done ? (
        <motion.div key="done" className="tutorial-bubble tutorial-bubble--done" role="status" variants={overshoot} initial="hidden" animate="visible">
          <strong>Treinamento concluído!</strong>
          <p>Você montou, executou, pausou e corrigiu um programa. Agora é hora das missões.</p>
          <motion.span {...PRESSABLE} style={{ display: 'inline-block' }}>
            <Link className="game-button game-button--primary game-button--md" to="/missoes">
              Ir para as missões
            </Link>
          </motion.span>
        </motion.div>
      ) : (
        step && (
          <motion.div
            key={step.id}
            className="tutorial-bubble"
            role="region"
            aria-label="Tutorial"
            aria-live="polite"
            variants={overshoot}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
          >
            <div className="tutorial-bubble__top">
              <span className="tutorial-bubble__count">
                {index + 1}/{TUTORIAL_STEPS.length}
              </span>
              <span className="tutorial-bubble__dots" aria-hidden="true">
                {TUTORIAL_STEPS.map((item, position) => (
                  <motion.span
                    key={item.id}
                    className={position <= index ? 'is-done' : ''}
                    animate={position === index && ambient ? { y: [0, -5, 0] } : { y: 0 }}
                    transition={position === index && ambient ? { duration: 0.8, repeat: Infinity, ease: EASINGS.easeOutCubic } : { duration: 0.2 }}
                  />
                ))}
              </span>
            </div>
            <p className="tutorial-bubble__text">
              {step.waitFor && (
                <motion.span
                  className="tutorial-bubble__arrow"
                  aria-hidden="true"
                  animate={ambient ? NUDGE.keyframes : undefined}
                  transition={ambient ? { ...NUDGE.options, repeat: Infinity, repeatDelay: 0.6 } : undefined}
                >
                  ➜
                </motion.span>
              )}
              {step.text}
            </p>
            {step.waitFor && <p className="tutorial-bubble__waiting">Faça a ação para continuar.</p>}
            <div className="tutorial-bubble__actions">
              <GameButton tone="secondary" icon="back" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0} aria-label="Passo anterior" />
              <GameButton tone="primary" disabled={step.waitFor !== null} onClick={() => setIndex((current) => current + 1)}>
                Próximo
              </GameButton>
            </div>
          </motion.div>
        )
      )}
    </AnimatePresence>
  )
}
```

O teste `TutorialOverlay.test.tsx` usa `getByText('1/6')`, "Próximo", "Treinamento concluído!" e o link "Ir para as missões" com `href="/missoes"` — mantidos. Com `mode="wait"`, o passo novo entra depois da saída do anterior; se o teste falhar por encontrar o texto antigo, troque `getByText('N/6')` por `await screen.findByText('N/6')` nesse teste e registre a mudança.

- [ ] **Step 6: Estilos**

Em `panels.css`, acrescentar:
```css
.icon-swap {
  display: inline-grid;
}

.speed-pills {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
  padding: 4px;
  border-radius: 12px;
  background: var(--color-surface-alt);
}

.speed-pills__option {
  position: relative;
  min-height: 38px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.speed-pills__indicator {
  position: absolute;
  inset: 0;
  border-radius: 9px;
  background: var(--water-500);
  box-shadow: 0 3px 0 #2f6fd6;
}

.speed-pills__label {
  position: relative;
  z-index: 1;
}

.speed-pills__option[aria-checked='true'] {
  color: #ffffff;
}

.execution-panel__speed {
  display: grid;
  gap: var(--space-1);
}

.console-entry__inner {
  display: inline-block;
}

.hints-panel__lock {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.hint {
  overflow: hidden;
}
```
Remover de `panels.css` as regras antigas `.execution-panel__speed` (grid de 3 colunas e `input`).

Em `TutorialOverlay.css`, acrescentar `.tutorial-bubble__dots span { display: inline-block; }` e `.tutorial-bubble__arrow { display: inline-block; margin-right: var(--space-2); color: var(--green-600); font-weight: 800; }`.

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/features && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat(gameplay): animate execution panel, speed pills, console toasts, hints and tutorial"
```

---

### Task 4.4: Página de gameplay, celebração e Blockly com halo/tremida

**Files:**
- Modify (substituir): `src/features/gameplay/GameplayPage.tsx`
- Modify: `src/features/gameplay/GameplayPage.css`, `src/blocks/editor/BlocklyEditor.tsx`, `src/blocks/editor/BlocklyEditor.css`
- Test: `src/features/gameplay/GameplayPage.test.tsx` (adicionar caso de voo)

**Interfaces:**
- Consumes: tudo das Tasks 4.1–4.3, `Confetti`, `PillTabs`, `SettingsDialog({ open })`, `BriefingDialog({ open })`, `locateCell`, `useFlightStore`, `useMotionPrefs`, `FOCUS_HALO`, `ERROR_SHAKE`.

- [ ] **Step 1: Adicionar teste que falha em `src/features/gameplay/GameplayPage.test.tsx`**

Acrescentar ao `describe`:
```tsx
  it('launches a harvest flight toward the harvest counter when a plant is harvested', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: '2d', motion: 'full' } })
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    const launch = vi.spyOn(useFlightStore.getState(), 'launch')
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(useFlightStore.getState().flights.length + useFlightStore.getState().arrivals).toBeGreaterThan(0)
    launch.mockRestore()
  })
```
e importar `useFlightStore` de `@/stores/flightStore`.

Run: `npx vitest run src/features/gameplay/GameplayPage.test.tsx`
Expected: FAIL — nenhum voo é lançado.

- [ ] **Step 2: Substituir `src/features/gameplay/GameplayPage.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { BlocklyEditor } from '@/blocks/editor/BlocklyEditor'
import { Confetti } from '@/components/game/Confetti'
import { PillTabs, panelId, tabId, type TabItem } from '@/components/game/PillTabs'
import { getMission } from '@/data/missions'
import { BriefingDialog } from '@/features/gameplay/components/BriefingDialog'
import { ConsolePanel } from '@/features/gameplay/components/ConsolePanel'
import { ExecutionPanel } from '@/features/gameplay/components/ExecutionPanel'
import { GameHud } from '@/features/gameplay/components/GameHud'
import { HarvestFlights } from '@/features/gameplay/components/HarvestFlights'
import { HintsPanel } from '@/features/gameplay/components/HintsPanel'
import { PseudocodePanel } from '@/features/gameplay/components/PseudocodePanel'
import { currentStepLabel, objectiveCells } from '@/features/gameplay/gameplayLogic'
import { useGameplaySession } from '@/features/gameplay/useGameplaySession'
import { useGameplayShortcuts } from '@/features/gameplay/useGameplayShortcuts'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { TutorialOverlay } from '@/features/tutorial/TutorialOverlay'
import { stepDelayMs } from '@/game/execution/types'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASINGS } from '@/motion/easings'
import { fadeSlide } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { locateCell } from '@/render/cellLocator'
import { FarmView } from '@/render/FarmView'
import { useGameAudio } from '@/services/audio/useGameAudio'
import { useFlightStore } from '@/stores/flightStore'
import { useProgressStore } from '@/stores/progressStore'
import './GameplayPage.css'

const SIDE_TABS: TabItem[] = [
  { id: 'console', label: 'Console' },
  { id: 'hints', label: 'Dicas' },
  { id: 'pseudocode', label: 'Pseudocódigo' },
]

const PANE_TABS: TabItem[] = [
  { id: 'program', label: 'Programa' },
  { id: 'farm', label: 'Fazenda' },
  { id: 'run', label: 'Execução' },
]

function harvestTargetCenter(): { x: number; y: number } | null {
  const target = document.querySelector('[data-flight-target="harvest"]')
  if (!target) return null
  const rect = target.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function GameplayScreen({ mission }: { mission: MissionDefinition }) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const { decorative } = useMotionPrefs()
  const session = useGameplaySession(mission)
  const { snapshot, controller } = session
  useGameAudio(snapshot)
  const launchFlight = useFlightStore((store) => store.launch)
  const [showBriefing, setShowBriefing] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [stepMode, setStepMode] = useState(false)
  const [sideTab, setSideTab] = useState('console')
  const [pane, setPane] = useState('program')
  const [blockEvent, setBlockEvent] = useState<{ kind: 'added' | 'removed'; id: number } | null>(null)
  const blockEventId = useRef(0)
  const highlightCells = useMemo(() => objectiveCells(mission), [mission])
  const succeeded = snapshot.status === 'finished' && snapshot.validation?.success === true

  useEffect(() => {
    if (!succeeded || mission.tutorial || !session.lastAttempt || session.lastAttempt.outcome !== 'success') return
    const timer = window.setTimeout(() => navigate(`/resultado/${mission.id}`), reducedMotion ? 600 : 2200)
    return () => window.clearTimeout(timer)
  }, [succeeded, mission, session.lastAttempt, navigate, reducedMotion])

  useEffect(() => {
    if (!decorative) return
    for (const event of snapshot.lastEvents) {
      if (event.type !== 'plotChanged' || event.to !== 'harvested') continue
      const from = locateCell(event.x, event.y)
      const to = harvestTargetCenter()
      if (from && to) launchFlight(from, to)
    }
  }, [snapshot.lastEvents, decorative, launchFlight])

  useGameplayShortcuts({
    run: () => (stepMode ? session.step() : session.run()),
    toggle: () => (snapshot.status === 'running' ? controller.pause() : snapshot.status === 'paused' ? controller.resume() : session.run()),
    step: () => session.step(),
    stop: () => controller.stop(),
  })

  const locked = snapshot.status === 'running' || snapshot.status === 'paused'

  return (
    <div className="gameplay" data-pane={pane}>
      <GameHud
        mission={mission}
        resources={snapshot.state.resources}
        onHelp={() => setShowBriefing(true)}
        onSettings={() => setShowSettings(true)}
        onExit={() => navigate('/missoes')}
      />
      <p className="gameplay__small-screen" role="note">
        A experiência completa de programação funciona melhor em telas a partir de 768 px (computador ou tablet).
      </p>
      <div className="gameplay__pane-tabs">
        <PillTabs items={PANE_TABS} active={pane} onChange={setPane} label="Áreas da tela" idPrefix="pane" />
      </div>
      <main className="gameplay__body">
        <section className="gameplay__editor" aria-label="Programa" id={panelId('pane', 'program')} aria-labelledby={tabId('pane', 'program')}>
          <BlocklyEditor
            toolbox={session.toolbox}
            initialJson={session.initialJson}
            readOnly={locked}
            highlightBlockId={snapshot.currentBlockId}
            errorBlock={session.errorBlock}
            looseBlockIds={session.serialized?.looseBlockIds ?? []}
            onChange={session.onWorkspaceChange}
            onLoadFailed={() => controller.addLog('warning', 'Não foi possível abrir o programa salvo desta fase. O editor foi reiniciado.')}
            onBlockEvent={(kind) => {
              blockEventId.current += 1
              setBlockEvent({ kind, id: blockEventId.current })
            }}
          />
        </section>
        <section className="gameplay__farm" id={panelId('pane', 'farm')} aria-labelledby={tabId('pane', 'farm')}>
          <FarmView
            state={snapshot.state}
            lastEvents={snapshot.lastEvents}
            eventKey={snapshot.stepCount}
            stepDurationMs={stepDelayMs(snapshot.speed)}
            highlightCells={highlightCells}
            failed={snapshot.status === 'failed'}
            seedKey={mission.id}
          />
          <AnimatePresence>
            {succeeded && (
              <motion.div
                key="celebration"
                className="gameplay__celebration"
                role="status"
                initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRINGS.jelly}
              >
                <motion.span
                  className="gameplay__celebration-burst"
                  aria-hidden="true"
                  initial={{ scale: 0.5, opacity: 0.9 }}
                  animate={{ scale: 2.6, opacity: 0 }}
                  transition={{ duration: 0.9, ease: EASINGS.easeOutCubic }}
                />
                <strong>Missão concluída!</strong>
                {mission.tutorial && <span> Você completou o treinamento.</span>}
              </motion.div>
            )}
          </AnimatePresence>
          {succeeded && <Confetti seed={`${mission.id}-play`} pieces={40} />}
          {mission.tutorial && <TutorialOverlay snapshot={snapshot} blockEvent={blockEvent} />}
        </section>
        <aside className="gameplay__side" id={panelId('pane', 'run')} aria-labelledby={tabId('pane', 'run')}>
          <ExecutionPanel
            status={snapshot.status}
            speed={snapshot.speed}
            stepMode={stepMode}
            actionCount={snapshot.state.actionCount}
            currentLabel={currentStepLabel(snapshot.lastStep)}
            onRun={session.run}
            onStep={session.step}
            onPause={() => controller.pause()}
            onResume={() => controller.resume()}
            onStop={() => controller.stop()}
            onReset={() => controller.reset()}
            onSpeedChange={(speed) => controller.setSpeed(speed)}
            onStepModeChange={setStepMode}
          />
          <div className="gameplay__side-tabs">
            <PillTabs items={SIDE_TABS} active={sideTab} onChange={setSideTab} label="Informações da execução" idPrefix="side" variant="underline" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={sideTab}
                role="tabpanel"
                id={panelId('side', sideTab)}
                aria-labelledby={tabId('side', sideTab)}
                className="gameplay__side-panel"
                variants={fadeSlide}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {sideTab === 'console' && <ConsolePanel entries={snapshot.log} onClear={() => controller.clearLog()} />}
                {sideTab === 'hints' && (
                  <HintsPanel
                    hints={mission.hints}
                    revealed={session.hintsRevealed}
                    canReveal={session.canReveal}
                    failedAttempts={session.failed}
                    onReveal={session.revealHint}
                  />
                )}
                {sideTab === 'pseudocode' && <PseudocodePanel text={session.pseudocode} valid={session.program !== null} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </aside>
      </main>
      <HarvestFlights />
      <BriefingDialog
        open={showBriefing}
        mission={mission}
        onStart={() => setShowBriefing(false)}
        onDemo={() => {
          setShowBriefing(false)
          session.runDemo()
        }}
      />
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export function GameplayPage() {
  const { missionId = '' } = useParams()
  const mission = getMission(missionId)
  const status = useProgressStore((store) => store.save.missions[missionId]?.status)
  if (!mission || !status || status === 'locked') return <Navigate to="/missoes" replace />
  return <GameplayScreen key={mission.id} mission={mission} />
}
```

Em `GameplayPage.css`: remover `@keyframes celebrate` e o `animation` de `.gameplay__celebration`; acrescentar:
```css
.gameplay__celebration {
  border: 4px solid #3fa34d;
  box-shadow: 0 8px 0 #2b7a37, var(--shadow-md);
  font-weight: 800;
  overflow: visible;
}

.gameplay__celebration-burst {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  border: 4px solid var(--sun-400);
  pointer-events: none;
}
```

- [ ] **Step 3: Halo e tremida no Blockly (`src/blocks/editor/BlocklyEditor.tsx`)**

- Importar `import { animate, type AnimationPlaybackControls } from 'motion'`, `import { ERROR_SHAKE, FOCUS_HALO } from '@/motion/presets'` e `import { useMotionPrefs } from '@/motion/useMotionPrefs'`.
- No corpo do componente: `const { reduced } = useMotionPrefs()` e `const haloRef = useRef<AnimationPlaybackControls | null>(null)`.
- Acrescentar a função auxiliar fora do componente:
```tsx
function blockPath(workspace: Blockly.WorkspaceSvg, id: string): SVGElement | null {
  return workspace.getBlockById(id)?.getSvgRoot().querySelector<SVGElement>('.blocklyPath') ?? null
}
```
- Substituir o efeito de `highlightBlockId` por:
```tsx
  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    workspace.highlightBlock(highlightBlockId)
    haloRef.current?.stop()
    const path = highlightBlockId ? blockPath(workspace, highlightBlockId) : null
    if (path && !reduced) haloRef.current = animate(path, FOCUS_HALO.keyframes, FOCUS_HALO.options)
    return () => {
      haloRef.current?.stop()
      if (path) path.style.filter = ''
    }
  }, [highlightBlockId, reduced])
```
- No efeito de `errorBlock`, depois de limpar avisos, remover a classe `agro-error-block` de todos os blocos (`block.getSvgRoot().classList.remove('agro-error-block')`); quando houver erro, além de `setWarningText` e `highlightBlock`, adicionar a classe ao bloco e, se `!reduced`, `animate(path, ERROR_SHAKE.keyframes, ERROR_SHAKE.options)` sobre `blockPath(workspace, errorBlock.id)`. Incluir `reduced` nas dependências.

Em `BlocklyEditor.css`:
```css
.blockly-editor .agro-error-block .blocklyPath {
  stroke: #e5484d;
  stroke-width: 3px;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: PASS (inclui o novo teste de voo).

- [ ] **Step 5: Verificação visual**

`npm run dev`, Fase 1: HUD desce com mola; números rolam; ao colher, tomate voa em arco até "Colheita" e o chip pula; botão Executar troca ícone; pílula de velocidade desliza; erro faz o painel tremer e o bloco tremer com contorno vermelho; bloco em execução brilha; linhas do console entram como toast; "Missão concluída!" entra com mola e confete.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat(gameplay): wire celebration, harvest flights and Blockly halo/shake into the gameplay screen"
```
