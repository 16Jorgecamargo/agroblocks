# AgroBlocks — Fase 2: Motor da simulação agrícola

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Engine puro e imutável: tipos do mundo, parser de mapa, robô, ações agrícolas, crescimento, sensores, validação de objetivos e eficiência.

**Architecture:** `src/game/` não importa React, Three.js nem Blockly. Toda ação é `applyAction(state, action, rules) → { state, events, error? }`. Erros têm código + mensagem + pista em PT-BR.

**Tech Stack:** TypeScript strict, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seção 4)

Leia `plan_index.md` (Global Constraints e Review Focus) antes de começar.

---

### Task 2.1: Tipos do mundo, erros e orientação do robô

**Files:**
- Create: `src/game/world/types.ts`
- Create: `src/game/rules/errors.ts`
- Create: `src/game/entities/robot.ts`
- Test: `src/game/entities/robot.test.ts`, `src/game/rules/errors.test.ts`

**Interfaces:**
- Produces (usados por todas as fases seguintes):
  - Tipos: `Facing`, `Terrain`, `PlotState`, `Moisture`, `Position`, `Cell`, `Robot`, `Resources`, `Capacity`, `ResourceUsage`, `GameState`, `ActionType`, `SensorType`, `ErrorCode`, `GameError`, `ResourceKey`, `GameEvent`, `WorldRules`, `ActionResult`, `WorldResources`, `WorldSetup`
  - Constantes: `ACTION_TYPES`, `SENSOR_TYPES`, `ERROR_CODES`
  - `ERROR_TEXT: Record<ErrorCode, { message: string; hint: string }>`
  - `createGameError(code: ErrorCode, overrides?: Partial<Record<ErrorCode, string>>): GameError`
  - `FACING_DELTA: Record<Facing, Position>`, `rotateLeft(f: Facing): Facing`, `rotateRight(f: Facing): Facing`, `positionAhead(robot: Robot): Position`

- [ ] **Step 1: Criar `src/game/world/types.ts`**

```ts
export type Facing = 'N' | 'E' | 'S' | 'W'
export type Terrain = 'soil' | 'obstacle' | 'blocked' | 'reservoir' | 'seedDepot'
export type PlotState = 'untilled' | 'tilled' | 'seeded' | 'growing' | 'mature' | 'harvested'
export type Moisture = 'dry' | 'wet'

export interface Position {
  x: number
  y: number
}

export interface Cell {
  terrain: Terrain
  plot: PlotState
  moisture: Moisture
  growth: number
}

export interface Robot extends Position {
  facing: Facing
}

export interface Resources {
  seeds: number | null
  water: number | null
  energy: number | null
  harvested: number
}

export interface Capacity {
  seeds: number | null
  water: number | null
}

export interface ResourceUsage {
  seeds: number
  water: number
  energy: number
}

export interface GameState {
  width: number
  height: number
  cells: Cell[][]
  robot: Robot
  resources: Resources
  capacity: Capacity
  usage: ResourceUsage
  actionCount: number
}

export const ACTION_TYPES = [
  'moveForward',
  'turnLeft',
  'turnRight',
  'prepareSoil',
  'plant',
  'water',
  'harvest',
  'collectResources',
] as const
export type ActionType = (typeof ACTION_TYPES)[number]

export const SENSOR_TYPES = ['isPlotEmpty', 'isSoilDry', 'isPlantMature', 'isObstacleAhead', 'hasSeeds'] as const
export type SensorType = (typeof SENSOR_TYPES)[number]

export const ERROR_CODES = [
  'OUT_OF_BOUNDS',
  'HIT_OBSTACLE',
  'PLOT_OCCUPIED',
  'SOIL_NOT_READY',
  'PLANT_NOT_MATURE',
  'NOTHING_TO_HARVEST',
  'NO_SEEDS',
  'NO_WATER',
  'NO_ENERGY',
  'NOT_AT_SUPPLY',
  'NOT_SOIL',
  'WATER_WASTED',
  'STEP_LIMIT',
  'INVALID_PROGRAM',
] as const
export type ErrorCode = (typeof ERROR_CODES)[number]

export interface GameError {
  code: ErrorCode
  message: string
  hint: string
}

export type ResourceKey = 'seeds' | 'water' | 'energy' | 'harvested'

export type GameEvent =
  | { type: 'robotMoved'; from: Position; to: Position }
  | { type: 'robotTurned'; facing: Facing }
  | { type: 'plotChanged'; x: number; y: number; from: PlotState; to: PlotState }
  | { type: 'moistureChanged'; x: number; y: number; moisture: Moisture }
  | { type: 'resourceChanged'; resource: ResourceKey; value: number | null }
  | { type: 'resourcesCollected'; resource: 'water' | 'seeds'; amount: number }

export interface WorldRules {
  growTicks: number
  forbidWaterWet: boolean
  mistakes?: Partial<Record<ErrorCode, string>>
}

export interface ActionResult {
  state: GameState
  events: GameEvent[]
  error?: GameError
}

export interface WorldResources {
  seeds: number | null
  water: number | null
  energy: number | null
  seedCapacity: number | null
  waterCapacity: number | null
}

export interface WorldSetup {
  map: { cells: string[] }
  robot: Robot
  resources: WorldResources
}
```

- [ ] **Step 2: Escrever testes que falham**

`src/game/entities/robot.test.ts`:
```ts
import { positionAhead, rotateLeft, rotateRight } from '@/game/entities/robot'

describe('robot orientation', () => {
  it('rotates right through a full cycle', () => {
    expect(rotateRight('N')).toBe('E')
    expect(rotateRight('E')).toBe('S')
    expect(rotateRight('S')).toBe('W')
    expect(rotateRight('W')).toBe('N')
  })

  it('rotates left through a full cycle', () => {
    expect(rotateLeft('N')).toBe('W')
    expect(rotateLeft('W')).toBe('S')
    expect(rotateLeft('S')).toBe('E')
    expect(rotateLeft('E')).toBe('N')
  })

  it('computes the position ahead for each facing with y growing south', () => {
    expect(positionAhead({ x: 2, y: 2, facing: 'N' })).toEqual({ x: 2, y: 1 })
    expect(positionAhead({ x: 2, y: 2, facing: 'E' })).toEqual({ x: 3, y: 2 })
    expect(positionAhead({ x: 2, y: 2, facing: 'S' })).toEqual({ x: 2, y: 3 })
    expect(positionAhead({ x: 2, y: 2, facing: 'W' })).toEqual({ x: 1, y: 2 })
  })
})
```

`src/game/rules/errors.test.ts`:
```ts
import { ERROR_CODES } from '@/game/world/types'
import { ERROR_TEXT, createGameError } from '@/game/rules/errors'

describe('game errors', () => {
  it('has a Portuguese message and hint for every error code', () => {
    for (const code of ERROR_CODES) {
      expect(ERROR_TEXT[code].message.length).toBeGreaterThan(10)
      expect(ERROR_TEXT[code].hint.length).toBeGreaterThan(10)
    }
  })

  it('uses the default hint when no override exists', () => {
    const error = createGameError('NO_WATER')
    expect(error).toEqual({ code: 'NO_WATER', ...ERROR_TEXT.NO_WATER })
  })

  it('replaces only the hint when an override exists', () => {
    const error = createGameError('HIT_OBSTACLE', { HIT_OBSTACLE: 'Vire antes da pedra.' })
    expect(error.message).toBe(ERROR_TEXT.HIT_OBSTACLE.message)
    expect(error.hint).toBe('Vire antes da pedra.')
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/game`
Expected: FAIL — módulos `@/game/entities/robot` e `@/game/rules/errors` não encontrados.

- [ ] **Step 4: Implementar `src/game/entities/robot.ts`**

```ts
import type { Facing, Position, Robot } from '@/game/world/types'

const CLOCKWISE: Facing[] = ['N', 'E', 'S', 'W']

export const FACING_DELTA: Record<Facing, Position> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
}

export function rotateRight(facing: Facing): Facing {
  return CLOCKWISE[(CLOCKWISE.indexOf(facing) + 1) % 4]
}

export function rotateLeft(facing: Facing): Facing {
  return CLOCKWISE[(CLOCKWISE.indexOf(facing) + 3) % 4]
}

export function positionAhead(robot: Robot): Position {
  const delta = FACING_DELTA[robot.facing]
  return { x: robot.x + delta.x, y: robot.y + delta.y }
}
```

- [ ] **Step 5: Implementar `src/game/rules/errors.ts`**

```ts
import type { ErrorCode, GameError } from '@/game/world/types'

export const ERROR_TEXT: Record<ErrorCode, { message: string; hint: string }> = {
  OUT_OF_BOUNDS: {
    message: 'O robô tentou sair da área da fazenda.',
    hint: 'Conte quantas casas existem até a borda antes de mover.',
  },
  HIT_OBSTACLE: {
    message: 'O robô encontrou um obstáculo.',
    hint: 'Confira a direção antes de executar o próximo movimento. O sensor "há obstáculo à frente?" pode ajudar.',
  },
  PLOT_OCCUPIED: {
    message: 'O robô tentou trabalhar em um canteiro ocupado.',
    hint: 'Verifique o estado do solo antes de plantar ou preparar.',
  },
  SOIL_NOT_READY: {
    message: 'O solo ainda não foi preparado para o plantio.',
    hint: 'Use "preparar solo" antes de plantar.',
  },
  PLANT_NOT_MATURE: {
    message: 'A planta ainda não está madura.',
    hint: 'Use o sensor de maturidade antes da colheita.',
  },
  NOTHING_TO_HARVEST: {
    message: 'Não há planta para colher neste canteiro.',
    hint: 'Confira se o robô está sobre o canteiro certo antes de colher.',
  },
  NO_SEEDS: {
    message: 'Acabaram as sementes.',
    hint: 'Planeje quantas sementes serão necessárias ou reabasteça no depósito de sementes.',
  },
  NO_WATER: {
    message: 'O reservatório do robô está vazio.',
    hint: 'Planeje quando será necessário reabastecer no reservatório.',
  },
  NO_ENERGY: {
    message: 'A energia do robô acabou.',
    hint: 'Procure um caminho com menos movimentos e menos ações repetidas.',
  },
  NOT_AT_SUPPLY: {
    message: 'Não há recursos para coletar aqui.',
    hint: 'Leve o robô até o reservatório ou até o depósito de sementes antes de coletar.',
  },
  NOT_SOIL: {
    message: 'Esta ação só funciona sobre um canteiro de terra.',
    hint: 'Mova o robô até um canteiro antes de executar a ação.',
  },
  WATER_WASTED: {
    message: 'O robô regou um solo que já estava molhado.',
    hint: 'Use o sensor "o solo está seco?" antes de regar para não desperdiçar água.',
  },
  STEP_LIMIT: {
    message: 'O programa executou passos demais e foi interrompido.',
    hint: 'Seu laço parece não terminar. Confira a condição de parada.',
  },
  INVALID_PROGRAM: {
    message: 'O programa tem um bloco que não pode ser executado.',
    hint: 'Confira se todos os procedimentos chamados existem.',
  },
}

export function createGameError(code: ErrorCode, overrides?: Partial<Record<ErrorCode, string>>): GameError {
  return {
    code,
    message: ERROR_TEXT[code].message,
    hint: overrides?.[code] ?? ERROR_TEXT[code].hint,
  }
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/game`
Expected: PASS (6 testes).

- [ ] **Step 7: Commit**

```bash
git add src/game
git commit -m "feat(engine): add world types, errors and robot orientation"
```

---

### Task 2.2: Parser de mapa, estado inicial, grade e recursos

**Files:**
- Create: `src/game/world/mapParser.ts`
- Create: `src/game/world/grid.ts`
- Create: `src/game/world/createInitialState.ts`
- Create: `src/game/rules/resources.ts`
- Create: `src/game/testing/makeState.ts`
- Test: `src/game/world/mapParser.test.ts`, `src/game/world/createInitialState.test.ts`, `src/game/rules/resources.test.ts`

**Interfaces:**
- Consumes: tipos da Task 2.1.
- Produces:
  - `class MapParseError extends Error`
  - `parseMap(rows: string[]): { width: number; height: number; cells: Cell[][] }`
  - `isInside(state: Pick<GameState, 'width' | 'height'>, position: Position): boolean`
  - `getCell(state: Pick<GameState, 'cells' | 'width' | 'height'>, position: Position): Cell` (lança `RangeError` fora do mapa)
  - `isWalkable(cell: Cell): boolean`
  - `updateCell(state: GameState, position: Position, patch: Partial<Cell>): GameState`
  - `createInitialState(setup: WorldSetup): GameState`
  - `UNLIMITED_RESOURCES: WorldResources`
  - `canSpend(resources: Resources, key: 'seeds' | 'water' | 'energy', amount: number): boolean`
  - `spend(state: GameState, key: 'seeds' | 'water' | 'energy', amount: number): GameState`
  - `resourceEvents(before: Resources, after: Resources): GameEvent[]`
  - Teste: `makeState(rows: string[], robot?: Partial<Robot>, resources?: Partial<WorldResources>): GameState`

- [ ] **Step 1: Escrever testes que falham**

`src/game/world/mapParser.test.ts`:
```ts
import { MapParseError, parseMap } from '@/game/world/mapParser'

describe('parseMap', () => {
  it('parses soil states, moisture suffix and terrain tokens', () => {
    const map = parseMap(['. tw g mw', '# X R S'])
    expect(map.width).toBe(4)
    expect(map.height).toBe(2)
    expect(map.cells[0][0]).toEqual({ terrain: 'soil', plot: 'untilled', moisture: 'dry', growth: 0 })
    expect(map.cells[0][1]).toEqual({ terrain: 'soil', plot: 'tilled', moisture: 'wet', growth: 0 })
    expect(map.cells[0][2].plot).toBe('growing')
    expect(map.cells[0][3]).toMatchObject({ plot: 'mature', moisture: 'wet' })
    expect(map.cells[1].map((cell) => cell.terrain)).toEqual(['obstacle', 'blocked', 'reservoir', 'seedDepot'])
  })

  it('parses seeded and harvested tokens', () => {
    const map = parseMap(['s h'])
    expect(map.cells[0].map((cell) => cell.plot)).toEqual(['seeded', 'harvested'])
  })

  it('tolerates repeated spaces between tokens', () => {
    expect(parseMap(['.   .  .']).width).toBe(3)
  })

  it('rejects rows of different widths', () => {
    expect(() => parseMap(['. .', '.'])).toThrow(MapParseError)
  })

  it('rejects unknown tokens and moisture on non-soil terrain', () => {
    expect(() => parseMap(['. q'])).toThrow(MapParseError)
    expect(() => parseMap(['#w'])).toThrow(MapParseError)
    expect(() => parseMap(['.x'])).toThrow(MapParseError)
  })

  it('rejects an empty map', () => {
    expect(() => parseMap([])).toThrow(MapParseError)
  })
})
```

`src/game/world/createInitialState.test.ts`:
```ts
import { createInitialState, UNLIMITED_RESOURCES } from '@/game/world/createInitialState'
import { MapParseError } from '@/game/world/mapParser'
import { getCell, isInside, updateCell } from '@/game/world/grid'

describe('createInitialState', () => {
  const setup = {
    map: { cells: ['. .', '. #'] },
    robot: { x: 0, y: 0, facing: 'E' as const },
    resources: { seeds: 3, water: 2, energy: 10, seedCapacity: 5, waterCapacity: 4 },
  }

  it('builds the state with resources, capacity and zero usage', () => {
    const state = createInitialState(setup)
    expect(state.robot).toEqual({ x: 0, y: 0, facing: 'E' })
    expect(state.resources).toEqual({ seeds: 3, water: 2, energy: 10, harvested: 0 })
    expect(state.capacity).toEqual({ seeds: 5, water: 4 })
    expect(state.usage).toEqual({ seeds: 0, water: 0, energy: 0 })
    expect(state.actionCount).toBe(0)
  })

  it('accepts unlimited resources', () => {
    const state = createInitialState({ ...setup, resources: UNLIMITED_RESOURCES })
    expect(state.resources.water).toBeNull()
  })

  it('rejects a robot outside the map or on an obstacle', () => {
    expect(() => createInitialState({ ...setup, robot: { x: 5, y: 0, facing: 'E' } })).toThrow(MapParseError)
    expect(() => createInitialState({ ...setup, robot: { x: 1, y: 1, facing: 'E' } })).toThrow(MapParseError)
  })

  it('updates a cell immutably', () => {
    const state = createInitialState(setup)
    const next = updateCell(state, { x: 1, y: 0 }, { plot: 'tilled' })
    expect(getCell(next, { x: 1, y: 0 }).plot).toBe('tilled')
    expect(getCell(state, { x: 1, y: 0 }).plot).toBe('untilled')
    expect(next.cells[1]).toBe(state.cells[1])
  })

  it('knows the map bounds', () => {
    const state = createInitialState(setup)
    expect(isInside(state, { x: 1, y: 1 })).toBe(true)
    expect(isInside(state, { x: -1, y: 0 })).toBe(false)
    expect(isInside(state, { x: 0, y: 2 })).toBe(false)
    expect(() => getCell(state, { x: 2, y: 0 })).toThrow(RangeError)
  })
})
```

`src/game/rules/resources.test.ts`:
```ts
import { canSpend, resourceEvents, spend } from '@/game/rules/resources'
import { makeState } from '@/game/testing/makeState'

describe('resources', () => {
  it('treats null as unlimited', () => {
    expect(canSpend({ seeds: null, water: 0, energy: 1, harvested: 0 }, 'seeds', 99)).toBe(true)
    expect(canSpend({ seeds: null, water: 0, energy: 1, harvested: 0 }, 'water', 1)).toBe(false)
  })

  it('decrements limited resources and always tracks usage', () => {
    const state = makeState(['.'], {}, { water: 3, seeds: null })
    const next = spend(spend(state, 'water', 1), 'seeds', 2)
    expect(next.resources.water).toBe(2)
    expect(next.resources.seeds).toBeNull()
    expect(next.usage).toEqual({ seeds: 2, water: 1, energy: 0 })
  })

  it('emits events only for resources that changed', () => {
    const before = { seeds: 2, water: 3, energy: null, harvested: 0 }
    const after = { seeds: 1, water: 3, energy: null, harvested: 1 }
    expect(resourceEvents(before, after)).toEqual([
      { type: 'resourceChanged', resource: 'seeds', value: 1 },
      { type: 'resourceChanged', resource: 'harvested', value: 1 },
    ])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/game`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/game/world/mapParser.ts`**

```ts
import type { Cell, PlotState, Terrain } from '@/game/world/types'

export class MapParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MapParseError'
  }
}

const PLOT_TOKENS: Record<string, PlotState> = {
  '.': 'untilled',
  t: 'tilled',
  s: 'seeded',
  g: 'growing',
  m: 'mature',
  h: 'harvested',
}

const TERRAIN_TOKENS: Record<string, Exclude<Terrain, 'soil'>> = {
  '#': 'obstacle',
  X: 'blocked',
  R: 'reservoir',
  S: 'seedDepot',
}

function parseCellToken(token: string, x: number, y: number): Cell {
  const [head, suffix, ...rest] = token
  const plot = PLOT_TOKENS[head]
  if (plot) {
    if (rest.length > 0 || (suffix !== undefined && suffix !== 'w')) {
      throw new MapParseError(`Token inválido "${token}" em (${x}, ${y})`)
    }
    return { terrain: 'soil', plot, moisture: suffix === 'w' ? 'wet' : 'dry', growth: 0 }
  }
  const terrain = TERRAIN_TOKENS[head]
  if (terrain && token.length === 1) {
    return { terrain, plot: 'untilled', moisture: 'dry', growth: 0 }
  }
  throw new MapParseError(`Token inválido "${token}" em (${x}, ${y})`)
}

export function parseMap(rows: string[]): { width: number; height: number; cells: Cell[][] } {
  if (rows.length === 0) throw new MapParseError('O mapa não tem linhas')
  const tokenRows = rows.map((row) => row.trim().split(/\s+/))
  const width = tokenRows[0].length
  const cells = tokenRows.map((tokens, y) => {
    if (tokens.length !== width) {
      throw new MapParseError(`A linha ${y} tem ${tokens.length} células, esperado ${width}`)
    }
    return tokens.map((token, x) => parseCellToken(token, x, y))
  })
  return { width, height: rows.length, cells }
}
```

- [ ] **Step 4: Implementar `src/game/world/grid.ts`**

```ts
import type { Cell, GameState, Position } from '@/game/world/types'

export function isInside(state: Pick<GameState, 'width' | 'height'>, position: Position): boolean {
  return position.x >= 0 && position.y >= 0 && position.x < state.width && position.y < state.height
}

export function getCell(state: Pick<GameState, 'cells' | 'width' | 'height'>, position: Position): Cell {
  if (!isInside(state, position)) {
    throw new RangeError(`Posição fora do mapa: (${position.x}, ${position.y})`)
  }
  return state.cells[position.y][position.x]
}

export function isWalkable(cell: Cell): boolean {
  return cell.terrain !== 'obstacle' && cell.terrain !== 'blocked'
}

export function updateCell(state: GameState, position: Position, patch: Partial<Cell>): GameState {
  const current = getCell(state, position)
  const row = state.cells[position.y].map((cell, x) => (x === position.x ? { ...current, ...patch } : cell))
  const cells = state.cells.map((existing, y) => (y === position.y ? row : existing))
  return { ...state, cells }
}
```

- [ ] **Step 5: Implementar `src/game/world/createInitialState.ts`**

```ts
import { MapParseError, parseMap } from '@/game/world/mapParser'
import { getCell, isInside, isWalkable } from '@/game/world/grid'
import type { GameState, WorldResources, WorldSetup } from '@/game/world/types'

export const UNLIMITED_RESOURCES: WorldResources = {
  seeds: null,
  water: null,
  energy: null,
  seedCapacity: null,
  waterCapacity: null,
}

export function createInitialState(setup: WorldSetup): GameState {
  const map = parseMap(setup.map.cells)
  const { robot, resources } = setup
  if (!isInside(map, robot) || !isWalkable(getCell(map, robot))) {
    throw new MapParseError(`Posição inicial do robô inválida: (${robot.x}, ${robot.y})`)
  }
  return {
    width: map.width,
    height: map.height,
    cells: map.cells,
    robot: { ...robot },
    resources: { seeds: resources.seeds, water: resources.water, energy: resources.energy, harvested: 0 },
    capacity: { seeds: resources.seedCapacity, water: resources.waterCapacity },
    usage: { seeds: 0, water: 0, energy: 0 },
    actionCount: 0,
  }
}
```

- [ ] **Step 6: Implementar `src/game/rules/resources.ts`**

```ts
import type { GameEvent, GameState, ResourceKey, Resources } from '@/game/world/types'

type SpendableKey = 'seeds' | 'water' | 'energy'

export function canSpend(resources: Resources, key: SpendableKey, amount: number): boolean {
  const current = resources[key]
  return current === null || current >= amount
}

export function spend(state: GameState, key: SpendableKey, amount: number): GameState {
  const current = state.resources[key]
  return {
    ...state,
    resources: { ...state.resources, [key]: current === null ? null : current - amount },
    usage: { ...state.usage, [key]: state.usage[key] + amount },
  }
}

const RESOURCE_KEYS: ResourceKey[] = ['seeds', 'water', 'energy', 'harvested']

export function resourceEvents(before: Resources, after: Resources): GameEvent[] {
  return RESOURCE_KEYS.filter((key) => before[key] !== after[key]).map((key) => ({
    type: 'resourceChanged' as const,
    resource: key,
    value: after[key],
  }))
}
```

- [ ] **Step 7: Implementar helper de teste `src/game/testing/makeState.ts`**

```ts
import { createInitialState, UNLIMITED_RESOURCES } from '@/game/world/createInitialState'
import type { GameState, Robot, WorldResources } from '@/game/world/types'

export function makeState(
  rows: string[],
  robot: Partial<Robot> = {},
  resources: Partial<WorldResources> = {},
): GameState {
  return createInitialState({
    map: { cells: rows },
    robot: { x: 0, y: 0, facing: 'E', ...robot },
    resources: { ...UNLIMITED_RESOURCES, ...resources },
  })
}
```

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run src/game`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/game
git commit -m "feat(engine): add map parser, grid helpers, initial state and resources"
```

---

### Task 2.3: Crescimento determinístico (`tickWorld`)

**Files:**
- Create: `src/game/rules/growth.ts`
- Test: `src/game/rules/growth.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameEvent`, `makeState`.
- Produces: `tickWorld(state: GameState, growTicks: number): { state: GameState; events: GameEvent[] }`

- [ ] **Step 1: Escrever teste que falha `src/game/rules/growth.test.ts`**

```ts
import { tickWorld } from '@/game/rules/growth'
import { makeState } from '@/game/testing/makeState'

describe('tickWorld', () => {
  it('grows a seeded plant on wet soil by one point per tick', () => {
    const result = tickWorld(makeState(['sw']), 3)
    expect(result.state.cells[0][0]).toMatchObject({ plot: 'seeded', growth: 1, moisture: 'wet' })
    expect(result.events).toEqual([])
  })

  it('does not grow plants on dry soil and does not kill them', () => {
    const result = tickWorld(makeState(['s g']), 1)
    expect(result.state.cells[0][0]).toMatchObject({ plot: 'seeded', growth: 0 })
    expect(result.state.cells[0][1]).toMatchObject({ plot: 'growing', growth: 0 })
  })

  it('advances seeded to growing at the threshold and dries the soil', () => {
    const first = tickWorld(makeState(['sw']), 2)
    const second = tickWorld(first.state, 2)
    expect(second.state.cells[0][0]).toEqual({ terrain: 'soil', plot: 'growing', moisture: 'dry', growth: 0 })
    expect(second.events).toEqual([
      { type: 'plotChanged', x: 0, y: 0, from: 'seeded', to: 'growing' },
      { type: 'moistureChanged', x: 0, y: 0, moisture: 'dry' },
    ])
  })

  it('advances growing to mature', () => {
    const result = tickWorld(makeState(['gw']), 1)
    expect(result.state.cells[0][0].plot).toBe('mature')
  })

  it('ignores mature, tilled and non-soil cells', () => {
    const state = makeState(['mw tw R'])
    const result = tickWorld(state, 1)
    expect(result.state.cells).toEqual(state.cells)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/game/rules/growth.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/game/rules/growth.ts`**

```ts
import type { Cell, GameEvent, GameState } from '@/game/world/types'

export function tickWorld(state: GameState, growTicks: number): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = []
  const cells = state.cells.map((row, y) =>
    row.map((cell, x): Cell => {
      if (cell.terrain !== 'soil' || cell.moisture !== 'wet') return cell
      if (cell.plot !== 'seeded' && cell.plot !== 'growing') return cell
      const growth = cell.growth + 1
      if (growth < growTicks) return { ...cell, growth }
      const next = cell.plot === 'seeded' ? 'growing' : 'mature'
      events.push(
        { type: 'plotChanged', x, y, from: cell.plot, to: next },
        { type: 'moistureChanged', x, y, moisture: 'dry' },
      )
      return { ...cell, plot: next, growth: 0, moisture: 'dry' }
    }),
  )
  return { state: { ...state, cells }, events }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/game/rules/growth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/rules/growth.ts src/game/rules/growth.test.ts
git commit -m "feat(engine): add deterministic plant growth"
```

---

### Task 2.4: Ações do robô (`applyAction`)

**Files:**
- Create: `src/game/rules/handlerTypes.ts`
- Create: `src/game/rules/movement.ts`
- Create: `src/game/rules/farmActions.ts`
- Create: `src/game/rules/applyAction.ts`
- Test: `src/game/rules/movement.test.ts`, `src/game/rules/farmActions.test.ts`, `src/game/rules/applyAction.test.ts`

**Interfaces:**
- Consumes: Tasks 2.1–2.3.
- Produces:
  - `type HandlerOutcome = { state: GameState; events: GameEvent[] } | { error: ErrorCode }`
  - `moveForward(state: GameState): HandlerOutcome`, `turn(state: GameState, direction: 'left' | 'right'): HandlerOutcome`
  - `prepareSoil(state)`, `plant(state)`, `water(state, rules: WorldRules)`, `harvest(state)`, `collectResources(state)` → `HandlerOutcome`
  - `ENERGY_COST: Record<ActionType, number>`
  - `applyAction(state: GameState, action: ActionType, rules: WorldRules): ActionResult` — verifica energia, executa handler, cobra energia, incrementa `actionCount`, roda `tickWorld`, concatena eventos (ação → recursos → crescimento). Em erro devolve o estado original inalterado.

- [ ] **Step 1: Escrever testes que falham**

`src/game/rules/movement.test.ts`:
```ts
import { applyAction } from '@/game/rules/applyAction'
import { makeState } from '@/game/testing/makeState'

const rules = { growTicks: 3, forbidWaterWet: false }

describe('movement', () => {
  it('moves forward one cell, spends one energy and emits robotMoved', () => {
    const state = makeState(['. .'], { facing: 'E' }, { energy: 5 })
    const result = applyAction(state, 'moveForward', rules)
    expect(result.error).toBeUndefined()
    expect(result.state.robot).toEqual({ x: 1, y: 0, facing: 'E' })
    expect(result.state.resources.energy).toBe(4)
    expect(result.state.usage.energy).toBe(1)
    expect(result.state.actionCount).toBe(1)
    expect(result.events[0]).toEqual({ type: 'robotMoved', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } })
  })

  it('turns without spending energy', () => {
    const state = makeState(['.'], { facing: 'N' }, { energy: 1 })
    const left = applyAction(state, 'turnLeft', rules)
    const right = applyAction(state, 'turnRight', rules)
    expect(left.state.robot.facing).toBe('W')
    expect(right.state.robot.facing).toBe('E')
    expect(left.state.resources.energy).toBe(1)
    expect(left.events).toEqual([{ type: 'robotTurned', facing: 'W' }])
  })

  it('fails with OUT_OF_BOUNDS at the map edge and keeps the state', () => {
    const state = makeState(['.'], { facing: 'N' })
    const result = applyAction(state, 'moveForward', rules)
    expect(result.error?.code).toBe('OUT_OF_BOUNDS')
    expect(result.state).toBe(state)
    expect(result.events).toEqual([])
  })

  it('fails with HIT_OBSTACLE on obstacles and blocked areas', () => {
    expect(applyAction(makeState(['. #']), 'moveForward', rules).error?.code).toBe('HIT_OBSTACLE')
    expect(applyAction(makeState(['. X']), 'moveForward', rules).error?.code).toBe('HIT_OBSTACLE')
  })

  it('walks onto reservoirs and seed depots', () => {
    const result = applyAction(makeState(['. R']), 'moveForward', rules)
    expect(result.state.robot.x).toBe(1)
  })

  it('fails with NO_ENERGY before moving when energy is zero', () => {
    const result = applyAction(makeState(['. .'], {}, { energy: 0 }), 'moveForward', rules)
    expect(result.error?.code).toBe('NO_ENERGY')
  })

  it('applies mission specific hints to errors', () => {
    const result = applyAction(makeState(['. #']), 'moveForward', {
      ...rules,
      mistakes: { HIT_OBSTACLE: 'A pedra está logo à frente.' },
    })
    expect(result.error?.hint).toBe('A pedra está logo à frente.')
  })
})
```

`src/game/rules/farmActions.test.ts`:
```ts
import { applyAction } from '@/game/rules/applyAction'
import { makeState } from '@/game/testing/makeState'
import type { ActionType, ErrorCode } from '@/game/world/types'

const rules = { growTicks: 5, forbidWaterWet: false }

function codeOf(row: string, action: ActionType, resources = {}): ErrorCode | undefined {
  return applyAction(makeState([row], {}, resources), action, rules).error?.code
}

describe('farm actions', () => {
  it('prepares untilled and harvested soil', () => {
    expect(applyAction(makeState(['.']), 'prepareSoil', rules).state.cells[0][0].plot).toBe('tilled')
    expect(applyAction(makeState(['h']), 'prepareSoil', rules).state.cells[0][0].plot).toBe('tilled')
  })

  it('refuses to prepare occupied soil', () => {
    for (const token of ['t', 's', 'g', 'm']) expect(codeOf(token, 'prepareSoil')).toBe('PLOT_OCCUPIED')
  })

  it('plants on tilled soil spending one seed', () => {
    const result = applyAction(makeState(['t'], {}, { seeds: 2 }), 'plant', rules)
    expect(result.state.cells[0][0]).toMatchObject({ plot: 'seeded', growth: 0 })
    expect(result.state.resources.seeds).toBe(1)
    expect(result.events).toContainEqual({ type: 'plotChanged', x: 0, y: 0, from: 'tilled', to: 'seeded' })
    expect(result.events).toContainEqual({ type: 'resourceChanged', resource: 'seeds', value: 1 })
  })

  it('maps planting errors', () => {
    expect(codeOf('s', 'plant')).toBe('PLOT_OCCUPIED')
    expect(codeOf('g', 'plant')).toBe('PLOT_OCCUPIED')
    expect(codeOf('m', 'plant')).toBe('PLOT_OCCUPIED')
    expect(codeOf('.', 'plant')).toBe('SOIL_NOT_READY')
    expect(codeOf('h', 'plant')).toBe('SOIL_NOT_READY')
    expect(codeOf('t', 'plant', { seeds: 0 })).toBe('NO_SEEDS')
  })

  it('waters soil spending one water', () => {
    const result = applyAction(makeState(['t'], {}, { water: 1 }), 'water', rules)
    expect(result.state.cells[0][0].moisture).toBe('wet')
    expect(result.state.resources.water).toBe(0)
    expect(result.state.usage.water).toBe(1)
  })

  it('fails with NO_WATER when the tank is empty', () => {
    expect(codeOf('t', 'water', { water: 0 })).toBe('NO_WATER')
  })

  it('allows watering wet soil unless the mission forbids it', () => {
    expect(codeOf('tw', 'water')).toBeUndefined()
    const strict = applyAction(makeState(['tw']), 'water', { ...rules, forbidWaterWet: true })
    expect(strict.error?.code).toBe('WATER_WASTED')
  })

  it('harvests mature plants and counts production', () => {
    const result = applyAction(makeState(['m']), 'harvest', rules)
    expect(result.state.cells[0][0].plot).toBe('harvested')
    expect(result.state.resources.harvested).toBe(1)
  })

  it('maps harvesting errors', () => {
    expect(codeOf('s', 'harvest')).toBe('PLANT_NOT_MATURE')
    expect(codeOf('g', 'harvest')).toBe('PLANT_NOT_MATURE')
    expect(codeOf('.', 'harvest')).toBe('NOTHING_TO_HARVEST')
    expect(codeOf('t', 'harvest')).toBe('NOTHING_TO_HARVEST')
    expect(codeOf('h', 'harvest')).toBe('NOTHING_TO_HARVEST')
  })

  it('rejects farm actions outside soil', () => {
    for (const action of ['prepareSoil', 'plant', 'water', 'harvest'] as const) {
      expect(codeOf('R', action)).toBe('NOT_SOIL')
    }
  })

  it('refills water at a reservoir up to capacity', () => {
    const state = makeState(['R'], {}, { water: 1, waterCapacity: 4 })
    const result = applyAction(state, 'collectResources', rules)
    expect(result.state.resources.water).toBe(4)
    expect(result.events).toContainEqual({ type: 'resourcesCollected', resource: 'water', amount: 3 })
  })

  it('refills seeds at a seed depot up to capacity', () => {
    const state = makeState(['S'], {}, { seeds: 0, seedCapacity: 6 })
    expect(applyAction(state, 'collectResources', rules).state.resources.seeds).toBe(6)
  })

  it('fails to collect away from supplies', () => {
    expect(codeOf('.', 'collectResources')).toBe('NOT_AT_SUPPLY')
  })

  it('does not count refills as usage', () => {
    const state = makeState(['R'], {}, { water: 0, waterCapacity: 3 })
    expect(applyAction(state, 'collectResources', rules).state.usage.water).toBe(0)
  })
})
```

`src/game/rules/applyAction.test.ts`:
```ts
import { applyAction, ENERGY_COST } from '@/game/rules/applyAction'
import { makeState } from '@/game/testing/makeState'
import { ACTION_TYPES } from '@/game/world/types'

describe('applyAction', () => {
  it('defines an energy cost for every action, zero only for turns', () => {
    for (const action of ACTION_TYPES) {
      const expected = action === 'turnLeft' || action === 'turnRight' ? 0 : 1
      expect(ENERGY_COST[action]).toBe(expected)
    }
  })

  it('ticks the world after every successful action', () => {
    const state = makeState(['sw .'], { x: 1 })
    const result = applyAction(state, 'turnLeft', { growTicks: 1, forbidWaterWet: false })
    expect(result.state.cells[0][0].plot).toBe('growing')
    expect(result.events.at(-2)).toEqual({ type: 'plotChanged', x: 0, y: 0, from: 'seeded', to: 'growing' })
  })

  it('grows a plant watered in the same action', () => {
    const state = makeState(['s'], {}, { water: 1 })
    const result = applyAction(state, 'water', { growTicks: 2, forbidWaterWet: false })
    expect(result.state.cells[0][0]).toMatchObject({ moisture: 'wet', growth: 1 })
  })

  it('does not tick the world when the action fails', () => {
    const state = makeState(['sw #'])
    const result = applyAction(state, 'moveForward', { growTicks: 1, forbidWaterWet: false })
    expect(result.state).toBe(state)
  })

  it('checks energy before every action with cost', () => {
    const state = makeState(['t'], {}, { energy: 0, seeds: 1 })
    expect(applyAction(state, 'plant', { growTicks: 1, forbidWaterWet: false }).error?.code).toBe('NO_ENERGY')
    expect(applyAction(state, 'turnRight', { growTicks: 1, forbidWaterWet: false }).error).toBeUndefined()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/game/rules`
Expected: FAIL — `@/game/rules/applyAction` não encontrado.

- [ ] **Step 3: Implementar `src/game/rules/handlerTypes.ts`**

```ts
import type { ErrorCode, GameEvent, GameState } from '@/game/world/types'

export type HandlerOutcome = { state: GameState; events: GameEvent[] } | { error: ErrorCode }
```

- [ ] **Step 4: Implementar `src/game/rules/movement.ts`**

```ts
import { positionAhead, rotateLeft, rotateRight } from '@/game/entities/robot'
import { getCell, isInside, isWalkable } from '@/game/world/grid'
import type { HandlerOutcome } from '@/game/rules/handlerTypes'
import type { GameState } from '@/game/world/types'

export function moveForward(state: GameState): HandlerOutcome {
  const target = positionAhead(state.robot)
  if (!isInside(state, target)) return { error: 'OUT_OF_BOUNDS' }
  if (!isWalkable(getCell(state, target))) return { error: 'HIT_OBSTACLE' }
  const from = { x: state.robot.x, y: state.robot.y }
  return {
    state: { ...state, robot: { ...state.robot, x: target.x, y: target.y } },
    events: [{ type: 'robotMoved', from, to: target }],
  }
}

export function turn(state: GameState, direction: 'left' | 'right'): HandlerOutcome {
  const facing = direction === 'left' ? rotateLeft(state.robot.facing) : rotateRight(state.robot.facing)
  return {
    state: { ...state, robot: { ...state.robot, facing } },
    events: [{ type: 'robotTurned', facing }],
  }
}
```

- [ ] **Step 5: Implementar `src/game/rules/farmActions.ts`**

```ts
import { canSpend, spend } from '@/game/rules/resources'
import { getCell, updateCell } from '@/game/world/grid'
import type { HandlerOutcome } from '@/game/rules/handlerTypes'
import type { Cell, GameState, PlotState, Position, WorldRules } from '@/game/world/types'

function robotPosition(state: GameState): Position {
  return { x: state.robot.x, y: state.robot.y }
}

function changePlot(state: GameState, position: Position, cell: Cell, to: PlotState, extra: Partial<Cell> = {}): HandlerOutcome {
  return {
    state: updateCell(state, position, { plot: to, ...extra }),
    events: [{ type: 'plotChanged', x: position.x, y: position.y, from: cell.plot, to }],
  }
}

export function prepareSoil(state: GameState): HandlerOutcome {
  const position = robotPosition(state)
  const cell = getCell(state, position)
  if (cell.terrain !== 'soil') return { error: 'NOT_SOIL' }
  if (cell.plot !== 'untilled' && cell.plot !== 'harvested') return { error: 'PLOT_OCCUPIED' }
  return changePlot(state, position, cell, 'tilled', { growth: 0 })
}

export function plant(state: GameState): HandlerOutcome {
  const position = robotPosition(state)
  const cell = getCell(state, position)
  if (cell.terrain !== 'soil') return { error: 'NOT_SOIL' }
  if (cell.plot === 'seeded' || cell.plot === 'growing' || cell.plot === 'mature') return { error: 'PLOT_OCCUPIED' }
  if (cell.plot !== 'tilled') return { error: 'SOIL_NOT_READY' }
  if (!canSpend(state.resources, 'seeds', 1)) return { error: 'NO_SEEDS' }
  return changePlot(spend(state, 'seeds', 1), position, cell, 'seeded', { growth: 0 })
}

export function water(state: GameState, rules: WorldRules): HandlerOutcome {
  const position = robotPosition(state)
  const cell = getCell(state, position)
  if (cell.terrain !== 'soil') return { error: 'NOT_SOIL' }
  if (cell.moisture === 'wet' && rules.forbidWaterWet) return { error: 'WATER_WASTED' }
  if (!canSpend(state.resources, 'water', 1)) return { error: 'NO_WATER' }
  return {
    state: updateCell(spend(state, 'water', 1), position, { moisture: 'wet' }),
    events: [{ type: 'moistureChanged', x: position.x, y: position.y, moisture: 'wet' }],
  }
}

export function harvest(state: GameState): HandlerOutcome {
  const position = robotPosition(state)
  const cell = getCell(state, position)
  if (cell.terrain !== 'soil') return { error: 'NOT_SOIL' }
  if (cell.plot === 'seeded' || cell.plot === 'growing') return { error: 'PLANT_NOT_MATURE' }
  if (cell.plot !== 'mature') return { error: 'NOTHING_TO_HARVEST' }
  const counted = { ...state, resources: { ...state.resources, harvested: state.resources.harvested + 1 } }
  return changePlot(counted, position, cell, 'harvested', { growth: 0 })
}

function refill(state: GameState, key: 'water' | 'seeds'): HandlerOutcome {
  const capacity = state.capacity[key]
  const current = state.resources[key]
  const amount = capacity === null || current === null ? 0 : Math.max(0, capacity - current)
  const value = current === null ? null : current + amount
  return {
    state: { ...state, resources: { ...state.resources, [key]: value } },
    events: [{ type: 'resourcesCollected', resource: key, amount }],
  }
}

export function collectResources(state: GameState): HandlerOutcome {
  const cell = getCell(state, robotPosition(state))
  if (cell.terrain === 'reservoir') return refill(state, 'water')
  if (cell.terrain === 'seedDepot') return refill(state, 'seeds')
  return { error: 'NOT_AT_SUPPLY' }
}
```

- [ ] **Step 6: Implementar `src/game/rules/applyAction.ts`**

```ts
import { createGameError } from '@/game/rules/errors'
import { collectResources, harvest, plant, prepareSoil, water } from '@/game/rules/farmActions'
import { tickWorld } from '@/game/rules/growth'
import { moveForward, turn } from '@/game/rules/movement'
import { canSpend, resourceEvents, spend } from '@/game/rules/resources'
import type { HandlerOutcome } from '@/game/rules/handlerTypes'
import type { ActionResult, ActionType, ErrorCode, GameState, WorldRules } from '@/game/world/types'

export const ENERGY_COST: Record<ActionType, number> = {
  moveForward: 1,
  turnLeft: 0,
  turnRight: 0,
  prepareSoil: 1,
  plant: 1,
  water: 1,
  harvest: 1,
  collectResources: 1,
}

const HANDLERS: Record<ActionType, (state: GameState, rules: WorldRules) => HandlerOutcome> = {
  moveForward: (state) => moveForward(state),
  turnLeft: (state) => turn(state, 'left'),
  turnRight: (state) => turn(state, 'right'),
  prepareSoil: (state) => prepareSoil(state),
  plant: (state) => plant(state),
  water: (state, rules) => water(state, rules),
  harvest: (state) => harvest(state),
  collectResources: (state) => collectResources(state),
}

function failure(state: GameState, code: ErrorCode, rules: WorldRules): ActionResult {
  return { state, events: [], error: createGameError(code, rules.mistakes) }
}

export function applyAction(state: GameState, action: ActionType, rules: WorldRules): ActionResult {
  const cost = ENERGY_COST[action]
  if (cost > 0 && !canSpend(state.resources, 'energy', cost)) return failure(state, 'NO_ENERGY', rules)
  const outcome = HANDLERS[action](state, rules)
  if ('error' in outcome) return failure(state, outcome.error, rules)
  const charged = cost > 0 ? spend(outcome.state, 'energy', cost) : outcome.state
  const counted = { ...charged, actionCount: charged.actionCount + 1 }
  const grown = tickWorld(counted, rules.growTicks)
  return {
    state: grown.state,
    events: [...outcome.events, ...resourceEvents(state.resources, grown.state.resources), ...grown.events],
  }
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/game`
Expected: PASS (todos).

- [ ] **Step 8: Commit**

```bash
git add src/game/rules
git commit -m "feat(engine): add robot movement, farm actions and applyAction"
```

---

### Task 2.5: Sensores

**Files:**
- Create: `src/game/sensors/evaluateSensor.ts`
- Test: `src/game/sensors/evaluateSensor.test.ts`

**Interfaces:**
- Consumes: `GameState`, `SensorType`, `getCell`, `isInside`, `isWalkable`, `positionAhead`.
- Produces: `evaluateSensor(state: GameState, sensor: SensorType): boolean`

- [ ] **Step 1: Escrever teste que falha**

```ts
import { evaluateSensor } from '@/game/sensors/evaluateSensor'
import { makeState } from '@/game/testing/makeState'

describe('evaluateSensor', () => {
  it('isPlotEmpty is true for untilled, tilled and harvested soil only', () => {
    expect(evaluateSensor(makeState(['.']), 'isPlotEmpty')).toBe(true)
    expect(evaluateSensor(makeState(['t']), 'isPlotEmpty')).toBe(true)
    expect(evaluateSensor(makeState(['h']), 'isPlotEmpty')).toBe(true)
    expect(evaluateSensor(makeState(['s']), 'isPlotEmpty')).toBe(false)
    expect(evaluateSensor(makeState(['m']), 'isPlotEmpty')).toBe(false)
    expect(evaluateSensor(makeState(['R']), 'isPlotEmpty')).toBe(false)
  })

  it('isSoilDry reads moisture of soil only', () => {
    expect(evaluateSensor(makeState(['s']), 'isSoilDry')).toBe(true)
    expect(evaluateSensor(makeState(['sw']), 'isSoilDry')).toBe(false)
    expect(evaluateSensor(makeState(['R']), 'isSoilDry')).toBe(false)
  })

  it('isPlantMature is true only for mature plants', () => {
    expect(evaluateSensor(makeState(['m']), 'isPlantMature')).toBe(true)
    expect(evaluateSensor(makeState(['g']), 'isPlantMature')).toBe(false)
  })

  it('isObstacleAhead detects obstacles, blocked cells and map edges', () => {
    expect(evaluateSensor(makeState(['. #']), 'isObstacleAhead')).toBe(true)
    expect(evaluateSensor(makeState(['. X']), 'isObstacleAhead')).toBe(true)
    expect(evaluateSensor(makeState(['.']), 'isObstacleAhead')).toBe(true)
    expect(evaluateSensor(makeState(['. .']), 'isObstacleAhead')).toBe(false)
    expect(evaluateSensor(makeState(['. R']), 'isObstacleAhead')).toBe(false)
  })

  it('hasSeeds treats unlimited seeds as available', () => {
    expect(evaluateSensor(makeState(['.']), 'hasSeeds')).toBe(true)
    expect(evaluateSensor(makeState(['.'], {}, { seeds: 1 }), 'hasSeeds')).toBe(true)
    expect(evaluateSensor(makeState(['.'], {}, { seeds: 0 }), 'hasSeeds')).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/game/sensors`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/game/sensors/evaluateSensor.ts`**

```ts
import { positionAhead } from '@/game/entities/robot'
import { getCell, isInside, isWalkable } from '@/game/world/grid'
import type { GameState, SensorType } from '@/game/world/types'

export function evaluateSensor(state: GameState, sensor: SensorType): boolean {
  const cell = getCell(state, state.robot)
  const isSoil = cell.terrain === 'soil'
  switch (sensor) {
    case 'isPlotEmpty':
      return isSoil && (cell.plot === 'untilled' || cell.plot === 'tilled' || cell.plot === 'harvested')
    case 'isSoilDry':
      return isSoil && cell.moisture === 'dry'
    case 'isPlantMature':
      return isSoil && cell.plot === 'mature'
    case 'isObstacleAhead': {
      const ahead = positionAhead(state.robot)
      return !isInside(state, ahead) || !isWalkable(getCell(state, ahead))
    }
    case 'hasSeeds':
      return state.resources.seeds === null || state.resources.seeds > 0
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/game/sensors`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/sensors
git commit -m "feat(engine): add robot sensors"
```

---

### Task 2.6: Objetivos, restrições e eficiência

**Files:**
- Create: `src/game/missions/goals.ts`
- Create: `src/game/missions/validateMission.ts`
- Create: `src/game/missions/efficiency.ts`
- Test: `src/game/missions/validateMission.test.ts`, `src/game/missions/efficiency.test.ts`

**Interfaces:**
- Consumes: `GameState`, `PlotState`.
- Produces:
  - `type CellRef = [number, number]`
  - `type Objective = { kind: 'harvestAtLeast'; count: number } | { kind: 'cellsInState'; cells: CellRef[]; state: PlotState } | { kind: 'allSoilInState'; state: PlotState } | { kind: 'robotAt'; x: number; y: number } | { kind: 'cellsWet'; cells: CellRef[] }`
  - `type Constraint = { kind: 'maxWaterUsed' | 'maxSeedsUsed' | 'maxEnergyUsed'; value: number }`
  - `interface MissionGoals { objectives: Objective[]; constraints?: Constraint[] }`
  - `interface GoalResult { description: string; met: boolean; detail: string }`
  - `interface MissionValidation { success: boolean; objectives: GoalResult[]; constraints: GoalResult[] }`
  - `PLOT_STATE_LABELS: Record<PlotState, string>`
  - `describeObjective(objective: Objective): string`, `describeConstraint(constraint: Constraint): string`
  - `validateMission(state: GameState, goals: MissionGoals): MissionValidation`
  - `interface EfficiencyReference { referenceActions: number; referenceBlocks: number }`
  - `type EfficiencyStars = 1 | 2 | 3`
  - `computeEfficiencyStars(actual: { actions: number; blocks: number }, reference: EfficiencyReference): EfficiencyStars`

- [ ] **Step 1: Escrever testes que falham**

`src/game/missions/validateMission.test.ts`:
```ts
import { validateMission } from '@/game/missions/validateMission'
import { makeState } from '@/game/testing/makeState'

describe('validateMission', () => {
  it('checks harvest count and explains what is missing', () => {
    const state = { ...makeState(['.']), resources: { seeds: null, water: null, energy: null, harvested: 1 } }
    const result = validateMission(state, { objectives: [{ kind: 'harvestAtLeast', count: 3 }] })
    expect(result.success).toBe(false)
    expect(result.objectives[0]).toEqual({
      description: 'Colher pelo menos 3 planta(s)',
      met: false,
      detail: 'Ainda faltam 2 planta(s) para colher.',
    })
  })

  it('checks a list of cells in a plot state', () => {
    const state = makeState(['s s t'])
    const ok = validateMission(state, { objectives: [{ kind: 'cellsInState', cells: [[0, 0], [1, 0]], state: 'seeded' }] })
    const missing = validateMission(state, { objectives: [{ kind: 'cellsInState', cells: [[0, 0], [2, 0]], state: 'seeded' }] })
    expect(ok.success).toBe(true)
    expect(missing.success).toBe(false)
    expect(missing.objectives[0].detail).toBe('1 canteiro(s) ainda não estão com semente plantada.')
  })

  it('checks all soil cells ignoring other terrain', () => {
    expect(validateMission(makeState(['t # t']), { objectives: [{ kind: 'allSoilInState', state: 'tilled' }] }).success).toBe(true)
    expect(validateMission(makeState(['t . R']), { objectives: [{ kind: 'allSoilInState', state: 'tilled' }] }).success).toBe(false)
  })

  it('checks robot position and wet cells', () => {
    const state = makeState(['sw s'], { x: 1 })
    expect(validateMission(state, { objectives: [{ kind: 'robotAt', x: 1, y: 0 }] }).success).toBe(true)
    expect(validateMission(state, { objectives: [{ kind: 'cellsWet', cells: [[0, 0]] }] }).success).toBe(true)
    expect(validateMission(state, { objectives: [{ kind: 'cellsWet', cells: [[0, 0], [1, 0]] }] }).success).toBe(false)
  })

  it('fails when a resource constraint is exceeded even if objectives are met', () => {
    const state = { ...makeState(['.']), usage: { seeds: 0, water: 5, energy: 0 } }
    const result = validateMission(state, {
      objectives: [{ kind: 'robotAt', x: 0, y: 0 }],
      constraints: [{ kind: 'maxWaterUsed', value: 4 }],
    })
    expect(result.success).toBe(false)
    expect(result.constraints[0]).toEqual({
      description: 'Usar no máximo 4 unidade(s) de água',
      met: false,
      detail: 'Usou 5, o limite é 4.',
    })
  })
})
```

`src/game/missions/efficiency.test.ts`:
```ts
import { computeEfficiencyStars } from '@/game/missions/efficiency'

describe('computeEfficiencyStars', () => {
  const reference = { referenceActions: 10, referenceBlocks: 5 }

  it('gives 3 stars at or near the reference', () => {
    expect(computeEfficiencyStars({ actions: 10, blocks: 5 }, reference)).toBe(3)
    expect(computeEfficiencyStars({ actions: 11, blocks: 5 }, reference)).toBe(3)
    expect(computeEfficiencyStars({ actions: 8, blocks: 4 }, reference)).toBe(3)
  })

  it('gives 2 stars up to 50% above the reference', () => {
    expect(computeEfficiencyStars({ actions: 15, blocks: 5 }, reference)).toBe(2)
    expect(computeEfficiencyStars({ actions: 10, blocks: 7 }, reference)).toBe(2)
  })

  it('gives 1 star beyond that but never zero', () => {
    expect(computeEfficiencyStars({ actions: 40, blocks: 30 }, reference)).toBe(1)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/game/missions`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/game/missions/goals.ts`**

```ts
import type { PlotState } from '@/game/world/types'

export type CellRef = [number, number]

export type Objective =
  | { kind: 'harvestAtLeast'; count: number }
  | { kind: 'cellsInState'; cells: CellRef[]; state: PlotState }
  | { kind: 'allSoilInState'; state: PlotState }
  | { kind: 'robotAt'; x: number; y: number }
  | { kind: 'cellsWet'; cells: CellRef[] }

export type Constraint = { kind: 'maxWaterUsed' | 'maxSeedsUsed' | 'maxEnergyUsed'; value: number }

export interface MissionGoals {
  objectives: Objective[]
  constraints?: Constraint[]
}

export interface GoalResult {
  description: string
  met: boolean
  detail: string
}

export interface MissionValidation {
  success: boolean
  objectives: GoalResult[]
  constraints: GoalResult[]
}

export const PLOT_STATE_LABELS: Record<PlotState, string> = {
  untilled: 'solo sem preparo',
  tilled: 'solo preparado',
  seeded: 'semente plantada',
  growing: 'planta em crescimento',
  mature: 'planta madura',
  harvested: 'colheita realizada',
}

export const CONSTRAINT_UNITS: Record<Constraint['kind'], string> = {
  maxWaterUsed: 'unidade(s) de água',
  maxSeedsUsed: 'semente(s)',
  maxEnergyUsed: 'unidade(s) de energia',
}

export function describeObjective(objective: Objective): string {
  switch (objective.kind) {
    case 'harvestAtLeast':
      return `Colher pelo menos ${objective.count} planta(s)`
    case 'cellsInState':
      return `Deixar ${objective.cells.length} canteiro(s) com ${PLOT_STATE_LABELS[objective.state]}`
    case 'allSoilInState':
      return `Deixar todos os canteiros com ${PLOT_STATE_LABELS[objective.state]}`
    case 'robotAt':
      return `Levar o robô até a posição (${objective.x}, ${objective.y})`
    case 'cellsWet':
      return `Deixar ${objective.cells.length} canteiro(s) com solo molhado`
  }
}

export function describeConstraint(constraint: Constraint): string {
  return `Usar no máximo ${constraint.value} ${CONSTRAINT_UNITS[constraint.kind]}`
}
```

- [ ] **Step 4: Implementar `src/game/missions/validateMission.ts`**

```ts
import {
  describeConstraint,
  describeObjective,
  PLOT_STATE_LABELS,
  type CellRef,
  type Constraint,
  type GoalResult,
  type MissionGoals,
  type MissionValidation,
  type Objective,
} from '@/game/missions/goals'
import type { Cell, GameState } from '@/game/world/types'

function countMissing(state: GameState, cells: CellRef[], test: (cell: Cell) => boolean): number {
  return cells.filter(([x, y]) => !test(state.cells[y][x])).length
}

function soilCells(state: GameState): CellRef[] {
  const refs: CellRef[] = []
  state.cells.forEach((row, y) => row.forEach((cell, x) => cell.terrain === 'soil' && refs.push([x, y])))
  return refs
}

function checkObjective(state: GameState, objective: Objective): GoalResult {
  const description = describeObjective(objective)
  switch (objective.kind) {
    case 'harvestAtLeast': {
      const harvested = state.resources.harvested
      const met = harvested >= objective.count
      const detail = met
        ? `Colhidas: ${harvested} de ${objective.count}.`
        : `Ainda faltam ${objective.count - harvested} planta(s) para colher.`
      return { description, met, detail }
    }
    case 'cellsInState':
    case 'allSoilInState': {
      const cells = objective.kind === 'cellsInState' ? objective.cells : soilCells(state)
      const label = PLOT_STATE_LABELS[objective.state]
      const missing = countMissing(state, cells, (cell) => cell.plot === objective.state)
      const detail = missing === 0
        ? `Todos os ${cells.length} canteiro(s) estão com ${label}.`
        : `${missing} canteiro(s) ainda não estão com ${label}.`
      return { description, met: missing === 0, detail }
    }
    case 'robotAt': {
      const met = state.robot.x === objective.x && state.robot.y === objective.y
      const detail = met
        ? 'O robô está na posição certa.'
        : `O robô parou em (${state.robot.x}, ${state.robot.y}).`
      return { description, met, detail }
    }
    case 'cellsWet': {
      const missing = countMissing(state, objective.cells, (cell) => cell.moisture === 'wet')
      const detail = missing === 0
        ? 'Todos os canteiros estão molhados.'
        : `${missing} canteiro(s) ainda estão com solo seco.`
      return { description, met: missing === 0, detail }
    }
  }
}

const USAGE_KEY = { maxWaterUsed: 'water', maxSeedsUsed: 'seeds', maxEnergyUsed: 'energy' } as const

function checkConstraint(state: GameState, constraint: Constraint): GoalResult {
  const used = state.usage[USAGE_KEY[constraint.kind]]
  const met = used <= constraint.value
  return {
    description: describeConstraint(constraint),
    met,
    detail: met ? `Usado: ${used}.` : `Usou ${used}, o limite é ${constraint.value}.`,
  }
}

export function validateMission(state: GameState, goals: MissionGoals): MissionValidation {
  const objectives = goals.objectives.map((objective) => checkObjective(state, objective))
  const constraints = (goals.constraints ?? []).map((constraint) => checkConstraint(state, constraint))
  const success = [...objectives, ...constraints].every((result) => result.met)
  return { success, objectives, constraints }
}
```

- [ ] **Step 5: Implementar `src/game/missions/efficiency.ts`**

```ts
export interface EfficiencyReference {
  referenceActions: number
  referenceBlocks: number
}

export type EfficiencyStars = 1 | 2 | 3

export function computeEfficiencyStars(
  actual: { actions: number; blocks: number },
  reference: EfficiencyReference,
): EfficiencyStars {
  const ratio = Math.max(actual.actions / reference.referenceActions, actual.blocks / reference.referenceBlocks)
  if (ratio <= 1.1) return 3
  if (ratio <= 1.5) return 2
  return 1
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/game && npm run typecheck`
Expected: PASS, typecheck limpo.

- [ ] **Step 7: Commit**

```bash
git add src/game/missions
git commit -m "feat(engine): add mission objectives, constraints and efficiency rating"
```
