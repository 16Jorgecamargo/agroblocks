# AgroBlocks World — Fase 2: `buildWorld` (layout puro)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Função pura e determinística que gera o mundo cheio (terreno, construções, floresta, chão, pasto, animais, borboletas) para `farm`, `map` e `home`, respeitando as regras de proporção e visibilidade.

**Architecture:** `src/render/world/` com tipos (`worldTypes.ts`), geometria 2D (`geometry.ts`), catálogo de modelos (`worldCatalog.ts`), rascunho com regras de ocupação (`worldDraft.ts`) e um arquivo por layout. Nada aqui importa React ou three.

**Spec:** seções 4, 5, 5b · Leia `plan_index.md` antes.

---

### Task 2.1: Tipos, geometria, catálogo e rascunho

**Files:**
- Create: `src/render/world/worldTypes.ts`, `src/render/world/geometry.ts`, `src/render/world/worldCatalog.ts`, `src/render/world/worldDraft.ts`
- Test: `src/render/world/geometry.test.ts`, `src/render/world/worldDraft.test.ts`

**Interfaces:**
- Consumes: `ModelId` (Fase 1), `createRandom`, `hashString` (`src/render/seededRandom.ts`).
- Produces:
  - `Vec2`, `Rect`, `Polyline`, `PropItem`, `AnimalSpecies`, `AnimalSpawn`, `WorldLayout`, `WorldDensity`, `WorldInput`, `World` (código abaixo)
  - `distanceToSegment`, `distanceToPolyline`, `pointInPolygon`, `rectDistance`, `segmentIntersection`, `polygonBounds`, `pointAlong`, `rectPolygon`
  - `CLUTTER_MODELS`, `TREE_MODELS`, `TALL_MODELS`, `EXEMPT_MODELS`, `footprint(model)`, `GRID_CLEARANCE = 1.2`, `FRONT_CLEARANCE = 5`
  - `class WorldDraft` com `isFree`, `place`, `placeNear`, `force`, `scatter`, `fenceLine`, `props`

- [ ] **Step 1: Testes que falham**

`src/render/world/geometry.test.ts`:
```ts
import { distanceToPolyline, pointAlong, pointInPolygon, rectDistance, rectPolygon, segmentIntersection } from '@/render/world/geometry'

describe('world geometry', () => {
  it('measures distance to a polyline', () => {
    expect(distanceToPolyline({ x: 1, z: 1 }, [{ x: 0, z: 0 }, { x: 2, z: 0 }])).toBeCloseTo(1)
    expect(distanceToPolyline({ x: 3, z: 0 }, [{ x: 0, z: 0 }, { x: 2, z: 0 }])).toBeCloseTo(1)
  })

  it('tests points inside polygons and rectangles', () => {
    const square = rectPolygon({ minX: 0, maxX: 2, minZ: 0, maxZ: 2 })
    expect(pointInPolygon({ x: 1, z: 1 }, square)).toBe(true)
    expect(pointInPolygon({ x: 3, z: 1 }, square)).toBe(false)
    expect(rectDistance({ x: 1, z: 1 }, { minX: 0, maxX: 2, minZ: 0, maxZ: 2 })).toBe(0)
    expect(rectDistance({ x: 5, z: 1 }, { minX: 0, maxX: 2, minZ: 0, maxZ: 2 })).toBe(3)
  })

  it('finds where two segments cross', () => {
    expect(segmentIntersection({ x: 0, z: -1 }, { x: 0, z: 1 }, { x: -1, z: 0 }, { x: 1, z: 0 })).toEqual({ x: 0, z: 0 })
    expect(segmentIntersection({ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 0, z: 1 }, { x: 1, z: 1 })).toBeNull()
  })

  it('walks along a polyline by fraction', () => {
    expect(pointAlong([{ x: 0, z: 0 }, { x: 4, z: 0 }], 0.25)).toEqual({ x: 1, z: 0 })
  })
})
```

`src/render/world/worldDraft.test.ts`:
```ts
import { createRandom } from '@/render/seededRandom'
import { WorldDraft } from '@/render/world/worldDraft'

const grid = { minX: -2, maxX: 2, minZ: -2, maxZ: 2 }

describe('WorldDraft', () => {
  it('keeps props away from the grid, paths, river and each other', () => {
    const draft = new WorldDraft(createRandom(1), {
      grid,
      paths: [{ points: [{ x: -10, z: 6 }, { x: 10, z: 6 }], width: 1 }],
      river: { points: [{ x: 8, z: -10 }, { x: 8, z: 10 }], width: 2 },
      keepOut: [],
      frontGuard: grid,
    })
    expect(draft.isFree('tree-a', { x: 0, z: 0 })).toBe(false)
    expect(draft.isFree('tree-a', { x: 0, z: 6 })).toBe(false)
    expect(draft.isFree('tree-a', { x: 8, z: 0 })).toBe(false)
    expect(draft.place('tree-a', { x: -6, z: -6 }, 0, 1)).toBe(true)
    expect(draft.isFree('tree-b', { x: -6.2, z: -6 })).toBe(false)
  })

  it('refuses tall props in front of the grid but accepts low ones', () => {
    const draft = new WorldDraft(createRandom(2), { grid, paths: [], river: null, keepOut: [], frontGuard: grid })
    expect(draft.isFree('barn', { x: 4, z: 4 })).toBe(false)
    expect(draft.isFree('flower-red', { x: 4, z: 4 })).toBe(true)
  })

  it('builds fence lines one unit per segment with a gate', () => {
    const draft = new WorldDraft(createRandom(3), { grid, paths: [], river: null, keepOut: [], frontGuard: null })
    const before = draft.props.length
    draft.fenceLine({ x: 10, z: 0 }, { x: 14, z: 0 }, 2)
    const added = draft.props.slice(before)
    expect(added).toHaveLength(4)
    expect(added.filter((prop) => prop.model === 'fence-gate')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/world`
Expected: FAIL — módulos inexistentes.

- [ ] **Step 3: `src/render/world/worldTypes.ts`**

```ts
import type { ModelId } from '@/render/models/manifest'

export interface Vec2 {
  x: number
  z: number
}

export interface Rect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface Polyline {
  points: Vec2[]
  width: number
}

export interface PropItem {
  model: ModelId
  x: number
  z: number
  rotation: number
  scale: number
}

export type AnimalSpecies = 'cow' | 'horse' | 'pig' | 'sheep' | 'llama' | 'pug'

export interface AnimalSpawn {
  id: string
  species: AnimalSpecies
  x: number
  z: number
  area: Vec2[]
}

export type WorldLayout = 'farm' | 'map' | 'home'

export type WorldDensity = 'full' | 'light'

export interface WorldInput {
  layout: WorldLayout
  gridWidth: number
  gridHeight: number
  seed: string
  density: WorldDensity
}

export interface World {
  ground: Rect
  island: boolean
  paths: Polyline[]
  river: Polyline | null
  trail: Vec2[]
  props: PropItem[]
  pasture: Vec2[] | null
  animals: AnimalSpawn[]
  butterflies: Vec2[]
}
```

- [ ] **Step 4: `src/render/world/geometry.ts`**

```ts
import type { Polyline, Rect, Vec2 } from '@/render/world/worldTypes'

export function distanceToSegment(point: Vec2, start: Vec2, end: Vec2): number {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const lengthSquared = dx * dx + dz * dz
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared))
  return Math.hypot(point.x - (start.x + dx * t), point.z - (start.z + dz * t))
}

export function distanceToPolyline(point: Vec2, line: Vec2[]): number {
  if (line.length === 1) return Math.hypot(point.x - line[0].x, point.z - line[0].z)
  let best = Infinity
  for (let index = 0; index < line.length - 1; index += 1) best = Math.min(best, distanceToSegment(point, line[index], line[index + 1]))
  return best
}

export function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index]
    const b = polygon[previous]
    const crosses = a.z > point.z !== b.z > point.z && point.x < ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

export function rectDistance(point: Vec2, rect: Rect): number {
  const dx = Math.max(rect.minX - point.x, 0, point.x - rect.maxX)
  const dz = Math.max(rect.minZ - point.z, 0, point.z - rect.maxZ)
  return Math.hypot(dx, dz)
}

export function rectPolygon(rect: Rect): Vec2[] {
  return [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
}

export function polygonBounds(polygon: Vec2[]): Rect {
  return {
    minX: Math.min(...polygon.map((point) => point.x)),
    maxX: Math.max(...polygon.map((point) => point.x)),
    minZ: Math.min(...polygon.map((point) => point.z)),
    maxZ: Math.max(...polygon.map((point) => point.z)),
  }
}

export function segmentIntersection(a: Vec2, b: Vec2, c: Vec2, d: Vec2): Vec2 | null {
  const denominator = (b.x - a.x) * (d.z - c.z) - (b.z - a.z) * (d.x - c.x)
  if (denominator === 0) return null
  const t = ((c.x - a.x) * (d.z - c.z) - (c.z - a.z) * (d.x - c.x)) / denominator
  const u = ((c.x - a.x) * (b.z - a.z) - (c.z - a.z) * (b.x - a.x)) / denominator
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { x: a.x + t * (b.x - a.x) + 0, z: a.z + t * (b.z - a.z) + 0 }
}

export function polylineLength(line: Vec2[]): number {
  let total = 0
  for (let index = 0; index < line.length - 1; index += 1) total += Math.hypot(line[index + 1].x - line[index].x, line[index + 1].z - line[index].z)
  return total
}

export function pointAlong(line: Vec2[], fraction: number): Vec2 {
  let remaining = polylineLength(line) * Math.max(0, Math.min(1, fraction))
  for (let index = 0; index < line.length - 1; index += 1) {
    const start = line[index]
    const end = line[index + 1]
    const length = Math.hypot(end.x - start.x, end.z - start.z)
    if (remaining <= length || index === line.length - 2) {
      const t = length === 0 ? 0 : remaining / length
      return { x: start.x + (end.x - start.x) * t, z: start.z + (end.z - start.z) * t }
    }
    remaining -= length
  }
  return line[line.length - 1]
}

export function crossings(path: Polyline, river: Polyline): { point: Vec2; angle: number }[] {
  const found: { point: Vec2; angle: number }[] = []
  for (let i = 0; i < path.points.length - 1; i += 1) {
    for (let j = 0; j < river.points.length - 1; j += 1) {
      const point = segmentIntersection(path.points[i], path.points[i + 1], river.points[j], river.points[j + 1])
      if (!point) continue
      const dx = path.points[i + 1].x - path.points[i].x
      const dz = path.points[i + 1].z - path.points[i].z
      found.push({ point, angle: Math.atan2(-dz, dx) })
    }
  }
  return found
}
```

- [ ] **Step 5: `src/render/world/worldCatalog.ts`**

```ts
import type { ModelId } from '@/render/models/manifest'

export const CLUTTER_MODELS = ['grass-short', 'grass-tall', 'clover', 'flower-patch', 'flower-red', 'flower-yellow', 'flower-purple', 'fern', 'mushrooms', 'pebble'] as const satisfies readonly ModelId[]

export const TREE_MODELS = ['tree-a', 'tree-b', 'tree-c', 'tree-d', 'mega-tree-a', 'mega-tree-b', 'pine', 'pine-round', 'mega-pine'] as const satisfies readonly ModelId[]

export const FOREST_MODELS: readonly ModelId[] = [...TREE_MODELS, ...TREE_MODELS, 'bush-large', 'bush-flowers', 'bush', 'rock-medium', 'rock-a']

export const TALL_MODELS: ReadonlySet<ModelId> = new Set<ModelId>([
  ...TREE_MODELS,
  'apple-tree',
  'barn',
  'small-barn',
  'open-barn',
  'silo',
  'silo-house',
  'tower-windmill',
  'windmill',
  'water-tower',
  'reservoir',
])

export const EXEMPT_MODELS: ReadonlySet<ModelId> = new Set<ModelId>(['fence', 'fence-gate', 'bridge', 'sign', 'lily'])

const FOOTPRINTS: Partial<Record<ModelId, number>> = {
  barn: 3.2,
  'small-barn': 1.8,
  'open-barn': 2.2,
  silo: 1.3,
  'silo-house': 2,
  'tower-windmill': 1.4,
  windmill: 1.8,
  'water-tower': 1.4,
  reservoir: 0.9,
  'chicken-coop': 0.9,
  'log-stack': 0.7,
  'apple-tree': 1.1,
  'rock-medium': 0.7,
  'rock-a': 0.6,
  'bush-large': 0.6,
  'bush-flowers': 0.5,
  bush: 0.4,
  'corn-row': 0.4,
  'wheat-row': 0.4,
  'lettuce-row': 0.4,
  'pumpkin-row': 0.4,
  'carrot-row': 0.4,
}

const CLUTTER_SET: ReadonlySet<ModelId> = new Set<ModelId>(CLUTTER_MODELS)

export function isClutter(model: ModelId): boolean {
  return CLUTTER_SET.has(model)
}

export function footprint(model: ModelId): number {
  if (CLUTTER_SET.has(model)) return 0.15
  if ((TREE_MODELS as readonly ModelId[]).includes(model)) return 0.8
  return FOOTPRINTS[model] ?? 0.4
}

export const GRID_CLEARANCE = 1.2

export const FRONT_CLEARANCE = 5

export const RIVER_BANK = 0.3
```

- [ ] **Step 6: `src/render/world/worldDraft.ts`**

```ts
import type { ModelId } from '@/render/models/manifest'
import { distanceToPolyline, pointInPolygon, rectDistance } from '@/render/world/geometry'
import { EXEMPT_MODELS, footprint, FRONT_CLEARANCE, GRID_CLEARANCE, isClutter, RIVER_BANK, TALL_MODELS } from '@/render/world/worldCatalog'
import type { Polyline, PropItem, Rect, Vec2 } from '@/render/world/worldTypes'

export interface DraftRules {
  grid: Rect | null
  paths: Polyline[]
  river: Polyline | null
  keepOut: Vec2[][]
  frontGuard: Rect | null
}

const SPIRAL_STEP = 0.5
const SPIRAL_LIMIT = 4
const SPIRAL_ANGLES = 12
const SCATTER_TRIES = 14

export class WorldDraft {
  readonly props: PropItem[] = []

  constructor(
    private readonly random: () => number,
    private readonly rules: DraftRules,
  ) {}

  isFree(model: ModelId, point: Vec2): boolean {
    const radius = footprint(model)
    const { grid, paths, river, keepOut, frontGuard } = this.rules
    if (grid && rectDistance(point, grid) < GRID_CLEARANCE + radius) return false
    if (frontGuard && TALL_MODELS.has(model) && point.x + point.z > 0 && rectDistance(point, frontGuard) < FRONT_CLEARANCE) return false
    for (const path of paths) if (distanceToPolyline(point, path.points) < path.width / 2 + radius) return false
    if (river && distanceToPolyline(point, river.points) < river.width / 2 + radius + RIVER_BANK) return false
    if (!isClutter(model) && keepOut.some((zone) => pointInPolygon(point, zone))) return false
    return this.props.every((prop) => EXEMPT_MODELS.has(prop.model) || Math.hypot(prop.x - point.x, prop.z - point.z) >= footprint(prop.model) + radius)
  }

  place(model: ModelId, point: Vec2, rotation: number, scale: number): boolean {
    if (!this.isFree(model, point)) return false
    this.props.push({ model, x: point.x, z: point.z, rotation, scale })
    return true
  }

  placeNear(model: ModelId, point: Vec2, rotation: number, scale = 1): boolean {
    if (this.place(model, point, rotation, scale)) return true
    for (let radius = SPIRAL_STEP; radius <= SPIRAL_LIMIT; radius += SPIRAL_STEP) {
      for (let step = 0; step < SPIRAL_ANGLES; step += 1) {
        const angle = (step / SPIRAL_ANGLES) * Math.PI * 2
        if (this.place(model, { x: point.x + Math.cos(angle) * radius, z: point.z + Math.sin(angle) * radius }, rotation, scale)) return true
      }
    }
    return false
  }

  force(model: ModelId, point: Vec2, rotation: number, scale = 1): void {
    this.props.push({ model, x: point.x, z: point.z, rotation, scale })
  }

  scatter(models: readonly ModelId[], count: number, area: Rect, scaleRange: [number, number], accept: (point: Vec2) => boolean = () => true): number {
    let placed = 0
    for (let tries = 0; tries < count * SCATTER_TRIES && placed < count; tries += 1) {
      const point = { x: area.minX + this.random() * (area.maxX - area.minX), z: area.minZ + this.random() * (area.maxZ - area.minZ) }
      if (!accept(point)) continue
      const model = models[Math.floor(this.random() * models.length)]
      const scale = scaleRange[0] + this.random() * (scaleRange[1] - scaleRange[0])
      if (this.place(model, point, this.random() * Math.PI * 2, scale)) placed += 1
    }
    return placed
  }

  fenceLine(from: Vec2, to: Vec2, gateIndex = -1): void {
    const dx = to.x - from.x
    const dz = to.z - from.z
    const length = Math.hypot(dx, dz)
    const segments = Math.max(1, Math.round(length))
    const rotation = Math.atan2(-dz, dx)
    for (let index = 0; index < segments; index += 1) {
      const t = (index + 0.5) / segments
      this.force(index === gateIndex ? 'fence-gate' : 'fence', { x: from.x + dx * t, z: from.z + dz * t }, rotation, length / segments)
    }
  }
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/render/world && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/render/world
git commit -m "feat(world): add world types, geometry, model catalog and placement draft"
```

---

### Task 2.2: Layout da fazenda do jogo

**Files:**
- Create: `src/render/world/farmLayout.ts`, `src/render/world/buildWorld.ts`, `src/render/world/scenery.ts`
- Test: `src/render/world/buildWorld.test.ts`

**Interfaces:**
- Consumes: Task 2.1, `MISSIONS` (`src/data/missions`).
- Produces: `buildWorld(input: WorldInput): World`; `gridSizeOf(cells: string[]): { width: number; height: number }`; `farmLayout(input, random): World`; em `scenery.ts`: `addClutter(draft, area, density, random?)`, `addButterflies(random, area, count)`, `addLilies(draft, river, count)`, `spawnHerd(random, pasture, herd, prefix)`.

- [ ] **Step 1: Teste que falha `src/render/world/buildWorld.test.ts`**

```ts
import { MISSIONS } from '@/data/missions'
import { buildWorld, gridSizeOf } from '@/render/world/buildWorld'
import { distanceToPolyline, pointInPolygon, rectDistance } from '@/render/world/geometry'
import { CLUTTER_MODELS, EXEMPT_MODELS, GRID_CLEARANCE, TALL_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import type { World } from '@/render/world/worldTypes'

const BUILDINGS = ['barn', 'small-barn', 'open-barn', 'silo', 'silo-house', 'tower-windmill', 'windmill', 'water-tower', 'reservoir', 'chicken-coop']

function farm(width: number, height: number, density: 'full' | 'light' = 'full'): World {
  return buildWorld({ layout: 'farm', gridWidth: width, gridHeight: height, seed: 'test', density })
}

describe('buildWorld farm', () => {
  it('is deterministic for the same seed', () => {
    expect(farm(5, 5)).toEqual(farm(5, 5))
  })

  it.each(MISSIONS.map((mission) => [mission.id, gridSizeOf(mission.map.cells)] as const))('keeps the grid of %s clear and visible', (_, size) => {
    const world = farm(size.width, size.height)
    const grid = { minX: -size.width / 2, maxX: size.width / 2, minZ: -size.height / 2, maxZ: size.height / 2 }
    for (const prop of world.props) {
      if (prop.model === 'fence' || prop.model === 'fence-gate') continue
      expect(rectDistance(prop, grid)).toBeGreaterThanOrEqual(GRID_CLEARANCE)
      if (TALL_MODELS.has(prop.model) && prop.x + prop.z > 0) expect(rectDistance(prop, grid)).toBeGreaterThanOrEqual(5)
    }
  })

  it('keeps paths and the river free except for bridges, signs and lilies', () => {
    const world = farm(5, 5)
    for (const prop of world.props) {
      if (EXEMPT_MODELS.has(prop.model)) continue
      for (const path of world.paths) expect(distanceToPolyline(prop, path.points)).toBeGreaterThanOrEqual(path.width / 2)
      if (world.river) expect(distanceToPolyline(prop, world.river.points)).toBeGreaterThanOrEqual(world.river.width / 2)
    }
  })

  it('fills the farm densely when graphics are full', () => {
    const world = farm(5, 5)
    const count = (models: readonly string[]) => world.props.filter((prop) => models.includes(prop.model)).length
    expect(count(CLUTTER_MODELS)).toBeGreaterThanOrEqual(300)
    expect(count(TREE_MODELS)).toBeGreaterThanOrEqual(60)
    expect(count(BUILDINGS)).toBeGreaterThanOrEqual(9)
    expect(count(['apple-tree'])).toBeGreaterThanOrEqual(8)
    expect(count(['bridge'])).toBeGreaterThanOrEqual(1)
    expect(world.animals.length).toBeGreaterThanOrEqual(12)
    expect(world.butterflies).toHaveLength(8)
  })

  it('drops ground clutter and half the forest in light mode', () => {
    const full = farm(5, 5)
    const light = farm(5, 5, 'light')
    expect(light.props.filter((prop) => (CLUTTER_MODELS as readonly string[]).includes(prop.model))).toHaveLength(0)
    const trees = (world: World) => world.props.filter((prop) => (TREE_MODELS as readonly string[]).includes(prop.model)).length
    expect(trees(light)).toBeLessThan(trees(full) * 0.7)
  })

  it('spawns pasture animals inside the pasture', () => {
    const world = farm(5, 5)
    for (const animal of world.animals) expect(pointInPolygon(animal, animal.area)).toBe(true)
  })

  it('reads mission grid sizes from the map rows', () => {
    expect(gridSizeOf(['. . . m .', '. # . . .'])).toEqual({ width: 5, height: 2 })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/render/world/buildWorld.test.ts`
Expected: FAIL — `buildWorld` inexistente.

- [ ] **Step 3: `src/render/world/scenery.ts`**

```ts
import type { ModelId } from '@/render/models/manifest'
import { pointAlong, pointInPolygon, polygonBounds } from '@/render/world/geometry'
import { CLUTTER_MODELS } from '@/render/world/worldCatalog'
import type { WorldDraft } from '@/render/world/worldDraft'
import type { AnimalSpawn, AnimalSpecies, Polyline, Rect, Vec2, WorldDensity } from '@/render/world/worldTypes'

const CLUTTER_MIX: { model: ModelId; share: number }[] = [
  { model: 'grass-short', share: 0.36 },
  { model: 'grass-tall', share: 0.14 },
  { model: 'clover', share: 0.16 },
  { model: 'flower-patch', share: 0.06 },
  { model: 'flower-red', share: 0.04 },
  { model: 'flower-yellow', share: 0.04 },
  { model: 'flower-purple', share: 0.04 },
  { model: 'fern', share: 0.06 },
  { model: 'mushrooms', share: 0.03 },
  { model: 'pebble', share: 0.07 },
]

export function addClutter(draft: WorldDraft, area: Rect, density: WorldDensity, total: number, accept?: (point: Vec2) => boolean): void {
  if (density === 'light') return
  for (const { model, share } of CLUTTER_MIX) draft.scatter([model], Math.round(total * share), area, [0.8, 1.25], accept)
}

export function clutterCount(models: readonly string[]): number {
  return models.filter((model) => (CLUTTER_MODELS as readonly string[]).includes(model)).length
}

export function addLilies(draft: WorldDraft, river: Polyline, count: number): void {
  for (let index = 0; index < count; index += 1) {
    const base = pointAlong(river.points, (index + 0.5) / count)
    const side = index % 2 === 0 ? 0.35 : -0.35
    draft.force('lily', { x: base.x + side, z: base.z - side }, index * 1.3, 1)
  }
}

export function addButterflies(random: () => number, area: Rect, count: number): Vec2[] {
  return Array.from({ length: count }, () => ({ x: area.minX + random() * (area.maxX - area.minX), z: area.minZ + random() * (area.maxZ - area.minZ) }))
}

export function spawnHerd(random: () => number, pasture: Vec2[], herd: [AnimalSpecies, number][], prefix: string): AnimalSpawn[] {
  const bounds = polygonBounds(pasture)
  const animals: AnimalSpawn[] = []
  for (const [species, count] of herd) {
    for (let index = 0; index < count; index += 1) {
      let point = { x: (bounds.minX + bounds.maxX) / 2, z: (bounds.minZ + bounds.maxZ) / 2 }
      for (let tries = 0; tries < 40; tries += 1) {
        const candidate = { x: bounds.minX + random() * (bounds.maxX - bounds.minX), z: bounds.minZ + random() * (bounds.maxZ - bounds.minZ) }
        if (pointInPolygon(candidate, pasture)) {
          point = candidate
          break
        }
      }
      animals.push({ id: `${prefix}-${species}-${index}`, species, x: point.x, z: point.z, area: pasture })
    }
  }
  return animals
}
```

- [ ] **Step 4: `src/render/world/farmLayout.ts`**

```ts
import { crossings, rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter, addLilies, spawnHerd } from '@/render/world/scenery'
import { FOREST_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

const CROP_ROWS = ['corn-row', 'wheat-row', 'lettuce-row', 'pumpkin-row', 'carrot-row'] as const

export function farmLayout(input: WorldInput, random: () => number): World {
  const hw = input.gridWidth / 2
  const hh = input.gridHeight / 2
  const full = input.density === 'full'
  const grid: Rect = { minX: -hw, maxX: hw, minZ: -hh, maxZ: hh }
  const yardPath: Polyline = { points: [{ x: -hw - 1.5, z: -hh - 5.5 }, { x: -hw * 0.3, z: -hh - 3 }, { x: 0, z: -hh - 1.6 }], width: 1.3 }
  const eastPath: Polyline = { points: [{ x: hw + 1.6, z: 0 }, { x: hw + 6, z: 0.6 }, { x: hw + 12, z: -0.4 }], width: 1.1 }
  const river: Polyline = {
    points: [
      { x: hw + 6.5, z: -hh - 16 },
      { x: hw + 4.5, z: -hh - 6 },
      { x: hw + 5.5, z: 0 },
      { x: hw + 4, z: hh + 6 },
      { x: hw + 6, z: hh + 16 },
    ],
    width: 2,
  }
  const pastureRect: Rect = { minX: -hw - 12, maxX: -hw - 3.5, minZ: -hh - 1, maxZ: hh + 5 }
  const pasture: Vec2[] = rectPolygon(pastureRect)
  const draft = new WorldDraft(random, { grid, paths: [yardPath, eastPath], river, keepOut: [pasture], frontGuard: grid })

  for (const crossing of crossings(eastPath, river)) draft.force('bridge', crossing.point, crossing.angle, 1)
  draft.force('sign', { x: 1.1, z: -hh - 2 }, 0, 1)

  for (let column = 0; column < input.gridWidth; column += 1) {
    const x = column - (input.gridWidth - 1) / 2
    draft.force('fence', { x, z: -hh - 0.55 }, 0, 1)
    draft.force('fence', { x, z: hh + 0.55 }, 0, 1)
  }
  for (let row = 0; row < input.gridHeight; row += 1) {
    const z = row - (input.gridHeight - 1) / 2
    draft.force('fence', { x: -hw - 0.55, z }, Math.PI / 2, 1)
    draft.force('fence', { x: hw + 0.55, z }, Math.PI / 2, 1)
  }

  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.maxZ }, 3)
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.maxZ })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.minZ })

  draft.placeNear('barn', { x: -hw - 3.5, z: -hh - 9 }, 0.35)
  draft.placeNear('silo', { x: -hw + 1.2, z: -hh - 11 }, 0)
  draft.placeNear('silo-house', { x: hw - 1, z: -hh - 11.5 }, -0.2)
  draft.placeNear('small-barn', { x: hw + 0.8, z: -hh - 7.5 }, -0.4)
  draft.placeNear('tower-windmill', { x: -hw - 9.5, z: -hh - 6.5 }, 0.6)
  draft.placeNear('water-tower', { x: -hw - 7.5, z: -hh - 11 }, 0)
  draft.placeNear('reservoir', { x: -hw + 2.6, z: -hh - 5.2 }, 0.3)
  draft.placeNear('chicken-coop', { x: -hw - 0.4, z: -hh - 6.2 }, 0.5)
  draft.placeNear('log-stack', { x: -hw + 4.2, z: -hh - 6.4 }, 0.2)
  draft.placeNear('open-barn', { x: -hw - 15, z: -hh - 3 }, 1.2)
  draft.placeNear('windmill', { x: hw + 11, z: -hh - 11 }, -0.5)

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      draft.placeNear('apple-tree', { x: hw + 8.5 + column * 2.4, z: -hh - 7 + row * 2.6 }, random() * Math.PI * 2, 0.9 + random() * 0.2)
    }
  }

  CROP_ROWS.forEach((model, rowIndex) => {
    for (let x = -hw + 0.5; x <= hw - 0.5; x += 1) draft.place(model, { x, z: hh + 2.8 + rowIndex * 1.1 }, 0, 1)
  })

  const core: Rect = { minX: -hw - 13, maxX: hw + 16, minZ: -hh - 13, maxZ: hh + 8.5 }
  draft.scatter(FOREST_MODELS, full ? 30 : 15, core, [0.85, 1.15])
  const ring: Rect = { minX: core.minX - 10, maxX: core.maxX + 10, minZ: core.minZ - 10, maxZ: core.maxZ + 10 }
  const outsideCore = (point: Vec2) => point.x < core.minX || point.x > core.maxX || point.z < core.minZ || point.z > core.maxZ
  draft.scatter(FOREST_MODELS, full ? 110 : 55, ring, [0.85, 1.2], outsideCore)
  draft.scatter(TREE_MODELS, full ? 20 : 10, { minX: -hw - 12, maxX: hw + 12, minZ: -hh - 13, maxZ: -hh - 9 }, [0.9, 1.15])

  addLilies(draft, river, 6)
  addClutter(draft, { minX: core.minX - 2, maxX: core.maxX + 2, minZ: core.minZ - 2, maxZ: core.maxZ + 2 }, input.density, 460)

  const animals = [
    ...spawnHerd(random, pasture, [['cow', 2], ['horse', 2], ['pig', 3], ['sheep', 4], ['llama', 1]], 'pasture'),
    ...spawnHerd(random, rectPolygon({ minX: -hw - 2, maxX: hw + 1, minZ: -hh - 4.8, maxZ: -hh - 2.6 }), [['pug', 1]], 'yard'),
  ]

  return {
    ground: { minX: ring.minX - 6, maxX: ring.maxX + 6, minZ: ring.minZ - 6, maxZ: ring.maxZ + 6 },
    island: false,
    paths: [yardPath, eastPath],
    river,
    trail: [],
    props: draft.props,
    pasture,
    animals,
    butterflies: addButterflies(random, { minX: -hw - 3, maxX: hw + 3, minZ: hh + 1.5, maxZ: hh + 7 }, 8),
  }
}
```

- [ ] **Step 5: `src/render/world/buildWorld.ts`**

```ts
import { createRandom, hashString } from '@/render/seededRandom'
import { farmLayout } from '@/render/world/farmLayout'
import { homeLayout } from '@/render/world/homeLayout'
import { mapLayout } from '@/render/world/mapLayout'
import type { World, WorldInput } from '@/render/world/worldTypes'

export function gridSizeOf(cells: string[]): { width: number; height: number } {
  return { width: cells[0]?.trim().split(/\s+/).length ?? 0, height: cells.length }
}

export function buildWorld(input: WorldInput): World {
  const random = createRandom(hashString(`${input.layout}:${input.seed}:${input.gridWidth}x${input.gridHeight}`))
  if (input.layout === 'map') return mapLayout(input, random)
  if (input.layout === 'home') return homeLayout(input, random)
  return farmLayout(input, random)
}
```

Para compilar já nesta task, criar `src/render/world/mapLayout.ts` e `src/render/world/homeLayout.ts` provisórios que delegam ao `farmLayout` (substituídos na Task 2.3):
```ts
import { farmLayout } from '@/render/world/farmLayout'
import type { World, WorldInput } from '@/render/world/worldTypes'

export function mapLayout(input: WorldInput, random: () => number): World {
  return farmLayout(input, random)
}
```
(e o mesmo com `homeLayout`).

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/render/world && npm run typecheck`
Expected: PASS. Se a contagem de clutter ficar abaixo de 300 porque a área ficou cheia, aumente o `total` em `addClutter` (460 → 520) e registre no ledger; não afrouxe o teste.

- [ ] **Step 7: Commit**

```bash
git add src/render/world
git commit -m "feat(world): build a dense farm layout around the mission grid"
```

---

### Task 2.3: Layouts do mapa de missões e da tela inicial

**Files:**
- Modify (substituir): `src/render/world/mapLayout.ts`, `src/render/world/homeLayout.ts`
- Modify: `src/render/world/buildWorld.test.ts`

**Interfaces:**
- Consumes: Tasks 2.1–2.2, `NODE_POSITIONS` (`src/features/mission-select/missionMapLayout.ts`).
- Produces: `mapLayout`, `homeLayout`, `HOME_BEDS: Rect`, `HOME_ROBOT: Vec2`, `MAP_ISLAND: Rect`; `World.trail` com 7 pontos no `map`.

- [ ] **Step 1: Testes que falham (acrescentar a `buildWorld.test.ts`)**

```ts
import { HOME_BEDS, HOME_ROBOT } from '@/render/world/homeLayout'
import { MAP_ISLAND } from '@/render/world/mapLayout'

describe('buildWorld map', () => {
  const world = buildWorld({ layout: 'map', gridWidth: 0, gridHeight: 0, seed: 'mission-map', density: 'full' })

  it('lays the seven mission nodes along a path on an island', () => {
    expect(world.island).toBe(true)
    expect(world.trail).toHaveLength(7)
    expect(world.paths[0].points).toEqual(world.trail)
  })

  it('bridges the river where the trail crosses it', () => {
    expect(world.props.filter((prop) => prop.model === 'bridge').length).toBeGreaterThanOrEqual(2)
  })

  it('keeps nodes clear of props and the river', () => {
    for (const node of world.trail) {
      for (const prop of world.props) if (!EXEMPT_MODELS.has(prop.model)) expect(Math.hypot(prop.x - node.x, prop.z - node.z)).toBeGreaterThanOrEqual(1.2)
      if (world.river) expect(distanceToPolyline(node, world.river.points)).toBeGreaterThanOrEqual(1.2)
    }
  })

  it('keeps everything on the island', () => {
    for (const prop of world.props) expect(rectDistance(prop, MAP_ISLAND)).toBe(0)
  })

  it('is dense', () => {
    expect(world.props.filter((prop) => (TREE_MODELS as readonly string[]).includes(prop.model)).length).toBeGreaterThanOrEqual(90)
    expect(world.animals.length).toBeGreaterThanOrEqual(5)
  })
})

describe('buildWorld home', () => {
  const world = buildWorld({ layout: 'home', gridWidth: 0, gridHeight: 0, seed: 'home', density: 'full' })

  it('keeps the crop beds and the robot spot clear', () => {
    for (const prop of world.props) {
      if (EXEMPT_MODELS.has(prop.model)) continue
      expect(rectDistance(prop, HOME_BEDS)).toBeGreaterThan(0.3)
      expect(Math.hypot(prop.x - HOME_ROBOT.x, prop.z - HOME_ROBOT.z)).toBeGreaterThanOrEqual(1)
    }
  })

  it('has the reference buildings and animals', () => {
    const models = new Set(world.props.map((prop) => prop.model))
    for (const model of ['barn', 'water-tower', 'tower-windmill', 'small-barn'] as const) expect(models.has(model)).toBe(true)
    expect(world.animals.length).toBeGreaterThanOrEqual(4)
  })
})
```

Run: `npx vitest run src/render/world/buildWorld.test.ts`
Expected: FAIL — exports inexistentes / layouts provisórios.

- [ ] **Step 2: `src/render/world/mapLayout.ts`**

```ts
import { NODE_POSITIONS } from '@/features/mission-select/missionMapLayout'
import { crossings, rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter, spawnHerd } from '@/render/world/scenery'
import { FOREST_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export const MAP_ISLAND: Rect = { minX: -10.5, maxX: 10.5, minZ: -10.5, maxZ: 10.5 }

function screen(horizontal: number, depth: number): Vec2 {
  return { x: (horizontal + depth) / 2, z: (depth - horizontal) / 2 }
}

const RIVER_SCREEN: [number, number][] = [
  [-16, 5],
  [-10, 6],
  [-6, 4],
  [-6, -4],
  [-2, -7.5],
  [6, -7.5],
  [6, -4],
  [6, 4],
  [10, 7],
  [16, 5],
]

export function mapLayout(input: WorldInput, random: () => number): World {
  const full = input.density === 'full'
  const trail = NODE_POSITIONS.map(([x, z]) => ({ x, z }))
  const trailPath: Polyline = { points: trail, width: 1 }
  const river: Polyline = { points: RIVER_SCREEN.map(([h, d]) => screen(h, d)), width: 1 }
  const pastureRect: Rect = { minX: -10, maxX: -7, minZ: -2.5, maxZ: 0.5 }
  const pasture = rectPolygon(pastureRect)
  const nodeZones = trail.map((node) => rectPolygon({ minX: node.x - 1.2, maxX: node.x + 1.2, minZ: node.z - 1.2, maxZ: node.z + 1.2 }))
  const draft = new WorldDraft(random, { grid: null, paths: [trailPath], river, keepOut: [pasture, ...nodeZones], frontGuard: null })
  const onIsland = (point: Vec2) => point.x > MAP_ISLAND.minX + 0.6 && point.x < MAP_ISLAND.maxX - 0.6 && point.z > MAP_ISLAND.minZ + 0.6 && point.z < MAP_ISLAND.maxZ - 0.6

  for (const crossing of crossings(trailPath, river)) draft.force('bridge', crossing.point, crossing.angle, 0.7)

  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.maxZ }, 1)
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.maxZ })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.maxZ }, { x: pastureRect.minX, z: pastureRect.minZ })

  draft.placeNear('barn', screen(-14, -7), Math.PI / 4, 0.6)
  draft.placeNear('small-barn', screen(1, 8), -0.4, 0.7)
  draft.placeNear('windmill', screen(11, -8), 0.3, 0.55)
  draft.placeNear('silo', screen(13, 4), 0, 0.5)
  draft.placeNear('tower-windmill', screen(-3, -9), 0.2, 0.55)
  draft.placeNear('chicken-coop', screen(-10, -5), 0.5, 0.8)
  draft.placeNear('water-tower', screen(16, 0), 0, 0.5)

  draft.scatter(FOREST_MODELS, full ? 160 : 70, MAP_ISLAND, [0.5, 0.75], onIsland)
  const awayFromNodes = (point: Vec2) => onIsland(point) && trail.every((node) => Math.hypot(point.x - node.x, point.z - node.z) >= 1.3)
  addClutter(draft, MAP_ISLAND, input.density, 240, awayFromNodes)

  return {
    ground: MAP_ISLAND,
    island: true,
    paths: [trailPath],
    river,
    trail,
    props: draft.props,
    pasture,
    animals: spawnHerd(random, pasture, [['sheep', 3], ['cow', 2]], 'map'),
    butterflies: addButterflies(random, MAP_ISLAND, 6),
  }
}
```

Se o teste "keeps nodes clear… river" falhar para algum nó, mova o(s) ponto(s) de `RIVER_SCREEN` vizinhos em no máximo 1 unidade de `depth` e registre no ledger.

- [ ] **Step 3: `src/render/world/homeLayout.ts`**

```ts
import { rectDistance, rectPolygon } from '@/render/world/geometry'
import { addButterflies, addClutter, spawnHerd } from '@/render/world/scenery'
import { FOREST_MODELS, TREE_MODELS } from '@/render/world/worldCatalog'
import { WorldDraft } from '@/render/world/worldDraft'
import type { Polyline, Rect, Vec2, World, WorldInput } from '@/render/world/worldTypes'

export const HOME_BEDS: Rect = { minX: -1.6, maxX: 2.8, minZ: 0, maxZ: 3.2 }

export const HOME_ROBOT: Vec2 = { x: 3.4, z: 4.6 }

export function homeLayout(input: WorldInput, random: () => number): World {
  const full = input.density === 'full'
  const farmPath: Polyline = { points: [{ x: -4.5, z: -1.5 }, { x: -2.4, z: -0.2 }, { x: -1.9, z: 1.2 }], width: 1.1 }
  const pastureRect: Rect = { minX: 3.2, maxX: 7.2, minZ: -2.8, maxZ: -0.5 }
  const pasture = rectPolygon(pastureRect)
  const robotZone = rectPolygon({ minX: HOME_ROBOT.x - 1, maxX: HOME_ROBOT.x + 1, minZ: HOME_ROBOT.z - 1, maxZ: HOME_ROBOT.z + 1 })
  const draft = new WorldDraft(random, { grid: null, paths: [farmPath], river: null, keepOut: [pasture, robotZone, rectPolygon(HOME_BEDS)], frontGuard: null })
  const awayFromBeds = (point: Vec2) => rectDistance(point, HOME_BEDS) > 0.6 && Math.hypot(point.x - HOME_ROBOT.x, point.z - HOME_ROBOT.z) > 1.2

  draft.placeNear('barn', { x: -6.5, z: -3.6 }, -1.15)
  draft.placeNear('water-tower', { x: -9.5, z: -8 }, 0)
  draft.placeNear('tower-windmill', { x: 8.6, z: -4.6 }, -0.4)
  draft.placeNear('small-barn', { x: -1.2, z: -11 }, -1.4)
  draft.placeNear('small-barn', { x: 5.5, z: -14 }, 0.3)
  draft.placeNear('silo', { x: -11, z: -12 }, 0)
  draft.placeNear('chicken-coop', { x: -3.8, z: -4.4 }, 0.4)
  draft.placeNear('log-stack', { x: -2.6, z: -2.8 }, 0.2)

  draft.fenceLine({ x: -3.1, z: 3.6 }, { x: 3.9, z: 3.6 })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.maxZ }, { x: pastureRect.maxX, z: pastureRect.maxZ })
  draft.fenceLine({ x: pastureRect.maxX, z: pastureRect.maxZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.maxX, z: pastureRect.minZ })
  draft.fenceLine({ x: pastureRect.minX, z: pastureRect.minZ }, { x: pastureRect.minX, z: pastureRect.maxZ }, 1)

  draft.scatter(FOREST_MODELS, full ? 80 : 35, { minX: -28, maxX: 28, minZ: -32, maxZ: -6 }, [0.9, 1.3])
  draft.scatter(TREE_MODELS, full ? 12 : 6, { minX: -13, maxX: -7, minZ: -4, maxZ: 5 }, [0.9, 1.2])
  draft.scatter(TREE_MODELS, full ? 10 : 5, { minX: 8, maxX: 13, minZ: -3, maxZ: 5 }, [0.9, 1.2])
  addClutter(draft, { minX: -11, maxX: 11, minZ: -4, maxZ: 8 }, input.density, 260, awayFromBeds)

  return {
    ground: { minX: -60, maxX: 60, minZ: -60, maxZ: 12 },
    island: false,
    paths: [farmPath],
    river: null,
    trail: [],
    props: draft.props,
    pasture,
    animals: spawnHerd(random, pasture, [['cow', 2], ['sheep', 2]], 'home'),
    butterflies: addButterflies(random, { minX: -2, maxX: 4, minZ: -0.5, maxZ: 4 }, 5),
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/render/world && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/world
git commit -m "feat(world): add island mission map and home landscape layouts"
```
