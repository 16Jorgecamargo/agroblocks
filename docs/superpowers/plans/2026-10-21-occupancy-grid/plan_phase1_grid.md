# Phase 1 — Occupancy grid

Read `plan_index.md` first (Global Constraints apply).

### Task 1.1: Grid storage and marking primitives

**Files:**
- Create: `src/render/world/navigation/occupancy.ts`
- Test: `src/render/world/navigation/occupancy.test.ts`

**Interfaces:**
- Produces:
  - `type Occupant = 'free' | 'road' | 'crop' | 'tree' | 'feed' | 'structure' | 'fence' | 'water' | 'marker' | 'missionGrid'`; `OCCUPANTS` lists them in that order (priority low → high)
  - `interface OccupancyGrid { cell: number; minX: number; minZ: number; columns: number; rows: number; cells: Uint8Array }` (byte = index in `OCCUPANTS`)
  - `createGrid(area: Rect, cell = 0.25): OccupancyGrid`
  - `cellIndex(grid, point: Vec2): number` (−1 outside), `cellCenter(grid, index: number): Vec2`, `occupantAt(grid, point: Vec2): Occupant` (`'structure'` outside)
  - `markRect(grid, center: Vec2, width: number, depth: number, rotation: number, occupant: Occupant): void` — width on local x, depth on local z, rotation as `WorldFeature.rotation`
  - `markCircle(grid, center, radius, occupant)`, `markPolygon(grid, points: Vec2[], occupant)`, `markSegment(grid, from, to, thickness, occupant)`
  - Marks only raise a cell (higher priority wins)

- [ ] **Step 1: Write the failing tests**

```ts
it('starts free and reports structure outside', () => {
  const grid = createGrid({ minX: -2, maxX: 2, minZ: -1, maxZ: 1 })
  expect(grid.columns).toBe(16); expect(grid.rows).toBe(8)
  expect(occupantAt(grid, { x: 0, z: 0 })).toBe('free')
  expect(occupantAt(grid, { x: 5, z: 0 })).toBe('structure')
})
it('marks a rotated rectangle by its real shape', () => {
  const grid = createGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
  markRect(grid, { x: 0, z: 0 }, 4, 0.5, Math.PI / 2, 'structure')
  expect(occupantAt(grid, { x: 0, z: 1.8 })).toBe('structure')
  expect(occupantAt(grid, { x: 1.8, z: 0 })).toBe('free')
})
it('keeps the higher-priority occupant', () => {
  const grid = createGrid({ minX: -2, maxX: 2, minZ: -2, maxZ: 2 })
  markCircle(grid, { x: 0, z: 0 }, 1, 'water'); markCircle(grid, { x: 0, z: 0 }, 1, 'road')
  expect(occupantAt(grid, { x: 0, z: 0 })).toBe('water')
})
it('marks fence segments and polygons', () => {
  const grid = createGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
  markSegment(grid, { x: -2, z: 1 }, { x: 2, z: 1 }, 0.15, 'fence')
  markPolygon(grid, [{ x: -2, z: -2 }, { x: 0, z: -2 }, { x: -1, z: -0.5 }], 'water')
  expect(occupantAt(grid, { x: 0.3, z: 1 })).toBe('fence')
  expect(occupantAt(grid, { x: 0.3, z: 1.4 })).toBe('free')
  expect(occupantAt(grid, { x: -1, z: -1.5 })).toBe('water')
})
```

- [ ] **Step 2: Run** `npx vitest run src/render/world/navigation/occupancy.test.ts` — Expected: FAIL (module not found).
- [ ] **Step 3: Implement `occupancy.ts`.** A cell is marked when its center is inside the shape (rect by inverse rotation, circle by distance, polygon with `pointInPolygon`, segment with `distanceToSegment ≤ thickness / 2`), visiting only cells in the shape's bounding box.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): occupancy grid with shape marking`

### Task 1.2: Object shapes

**Files:**
- Create: `src/render/world/navigation/shapes.ts`
- Test: `src/render/world/navigation/shapes.test.ts`

**Interfaces:**
- Consumes: `Occupant` (1.1), `FEATURE_KINDS`, `FeatureKind`, `ModelId`.
- Produces:
  - `type Shape = { form: 'rect'; width: number; depth: number; occupant: Occupant } | { form: 'circle'; radius: number; occupant: Occupant } | { form: 'none' }`
  - `FEATURE_SHAPES: Record<FeatureKind, Shape>`, `modelShape(model: ModelId): Shape`
  - Values from each builder's geometry (width = local x, depth = local z). Pinned: every `*Bed` and `beanTrellis` rect 1.4×0.8 `crop`; `cornStalk` circle 0.2 `crop`; fruit trees circle 0.7 `tree`; `sapling` circle 0.25 `crop`; `berryBush` circle 0.4 `crop`; `trough` rect 1.2×0.5 `feed`; `hayRack` rect 1.4×0.6 `feed`; `hedge`/`stoneWall`/`meshFence` rect 1×0.45 `fence`; `greenhouseBay` 3×2, `tallGreenhouse` 4.2×2.6, `machineShed` 4.4×2.8, `farmhouse` 2.8×2.2, `packingShed` 2.6×2, `toolShed` 1.6×1.2, `pier` 0.7×1.3 — all `structure`; `chicken`, `fallenFruit` `none`. Models: tree models circle 0.55 `tree`; `bush` 0.35 and `bush-large` 0.55 `tree`; `barn` rect 3.6×2.8, `silo` circle 0.9, `chicken-coop` rect 1.2×1 `structure`; clutter and `lily` `none`. `fence`/`fence-gate` are rasterized in 1.3.

- [ ] **Step 1: Write the failing tests**

```ts
it.each(FEATURE_KINDS)('%s has a shape', (kind) => expect(FEATURE_SHAPES[kind]).toBeDefined())
it('feeds, crops and buildings block with the right occupant', () => {
  expect(FEATURE_SHAPES.trough).toMatchObject({ form: 'rect', occupant: 'feed' })
  expect(FEATURE_SHAPES.cabbageBed).toMatchObject({ form: 'rect', width: 1.4, depth: 0.8, occupant: 'crop' })
  expect(FEATURE_SHAPES.machineShed).toMatchObject({ occupant: 'structure' })
  expect(modelShape('barn')).toMatchObject({ occupant: 'structure' })
  expect(modelShape('grass-short')).toEqual({ form: 'none' })
})
```

- [ ] **Step 2: Run** `npx vitest run src/render/world/navigation/shapes.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement `shapes.ts`.**
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): real footprints for every world object`

### Task 1.3: Rasterize a world

**Files:**
- Create: `src/render/world/navigation/buildOccupancy.ts`
- Modify: `src/render/world/worldTypes.ts` (add `missionGrid?: Rect | null` to `World`), `src/render/world/landscapes/stage.ts` (`missionGrid: grid` in `stageFarm`, `null` in `stageMap`)
- Test: `src/render/world/navigation/buildOccupancy.test.ts`

**Interfaces:**
- Consumes: 1.1, 1.2.
- Produces: `buildOccupancy(world: World): OccupancyGrid` over `world.ground`. Marks: paths `road` (segments of `path.width`), waters `water`, features by shape scaled by `feature.scale`, props by `modelShape` scaled, `fence`/`fence-gate` props as a segment of length `prop.scale` along direction `(cos r, −sin r)` with thickness 0.15 `fence`, trail nodes `marker` circle 0.8, `world.missionGrid` rect `missionGrid`.

- [ ] **Step 1: Write the failing tests**

```ts
it('blocks the barn, fences, troughs and trail markers on the barnyard map', () => {
  const world = buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'barnyard', density: 'full', theme: 'barnyard' })
  const grid = buildOccupancy(world)
  expect(occupantAt(grid, world.props.find((prop) => prop.model === 'barn')!)).toBe('structure')
  for (const node of world.trail) expect(occupantAt(grid, node)).toBe('marker')
  expect(occupantAt(grid, world.features.find((feature) => feature.kind === 'trough')!)).toBe('feed')
  expect(world.props.filter((prop) => prop.model === 'fence').every((fence) => occupantAt(grid, fence) === 'fence')).toBe(true)
})
it('blocks the mission grid on a farm scene', () => {
  const world = buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: 'garden-01', density: 'full', theme: 'garden' })
  expect(world.missionGrid).toEqual({ minX: -2.5, maxX: 2.5, minZ: -1.5, maxZ: 1.5 })
  expect(occupantAt(buildOccupancy(world), { x: 0, z: 0 })).toBe('missionGrid')
})
it('is the same grid on every build', () => {
  const make = () => buildOccupancy(buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: 'garden', density: 'full', theme: 'garden' }))
  expect(make().cells).toEqual(make().cells)
})
```

- [ ] **Step 2: Run** `npx vitest run src/render/world/navigation/buildOccupancy.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `buildOccupancy` and `missionGrid`.
- [ ] **Step 4: Run** the test and `npx tsc --noEmit -p tsconfig.json` — Expected: PASS, no type errors.
- [ ] **Step 5: Commit** `feat(render): rasterize every scene into an occupancy grid`
