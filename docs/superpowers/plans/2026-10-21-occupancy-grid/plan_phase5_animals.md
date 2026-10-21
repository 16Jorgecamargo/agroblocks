# Phase 5 — Animals on free cells, never through each other

Read `plan_index.md` first (Global Constraints apply).

### Task 5.1: Pen cells, spawn without overlap

**Files:**
- Create: `src/render/world/navigation/placeHerd.ts`
- Modify: `src/render/world/worldTypes.ts` (add `walk?: Vec2[]` to `AnimalSpawn`), `src/render/world/animalBrain.ts` (add `BODY_RADIUS`), `src/render/world/landscapes/stage.ts` (after `buildOccupancy`: `animals: placeHerd(world.animals, walkMask(grid, 'animal'), random)`)
- Test: `src/render/world/navigation/placeHerd.test.ts`

**Interfaces:**
- Consumes: `walkMask`, `isOpen` (2.1), `cellCenter` (1.1), `pointInPolygon`.
- Produces:
  - `BODY_RADIUS: Record<AnimalSpecies, number>` — cow `0.55`, horse `0.6`, pig `0.4`, sheep `0.4`, llama `0.45`, pug `0.25` (times `spawn.scale` at use)
  - `placeHerd(animals: AnimalSpawn[], mask: WalkMask, random: () => number): AnimalSpawn[]` — for each animal: `walk` = centers of open cells inside its `area`; new `x, z` picked from `walk` so the distance to every already placed animal is ≥ the sum of both body radii; animals with empty `walk` or no free spot are dropped

- [ ] **Step 1: Write the failing tests**

```ts
const scenes = () => WORLD_IDS.flatMap((theme) => [buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme }), buildWorld({ layout: 'farm', gridWidth: 5, gridHeight: 3, seed: `${theme}-01`, density: 'full', theme })])

it('starts every animal on a free cell of its own pen, away from troughs and fences', () => {
  for (const world of scenes()) {
    const mask = walkMask(buildOccupancy(world), 'animal')
    for (const animal of world.animals) {
      expect(isOpen(mask, animal)).toBe(true)
      expect(pointInPolygon(animal, animal.area)).toBe(true)
      expect(animal.walk!.length).toBeGreaterThan(0)
      for (const cell of animal.walk!) expect(isOpen(mask, cell) && pointInPolygon(cell, animal.area)).toBe(true)
    }
  }
})
it('never spawns two animals on top of each other', () => {
  for (const world of scenes()) world.animals.forEach((a, i) => world.animals.slice(i + 1).forEach((b) => expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(BODY_RADIUS[a.species] * a.scale + BODY_RADIUS[b.species] * b.scale - 1e-9)))
})
it('drops an animal whose pen has no free cell', () => {
  const grid = createGrid({ minX: -2, maxX: 2, minZ: -2, maxZ: 2 }); markRect(grid, { x: 0, z: 0 }, 4, 4, 0, 'feed')
  const cow: AnimalSpawn = { id: 'c', species: 'cow', x: 0, z: 0, area: rectPolygon({ minX: -1, maxX: 1, minZ: -1, maxZ: 1 }), scale: 1 }
  expect(placeHerd([cow], walkMask(grid, 'animal'), createRandom(1))).toEqual([])
})
```

- [ ] **Step 2: Run** `npx vitest run src/render/world/navigation/placeHerd.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `placeHerd`, `BODY_RADIUS`, the `walk` field and the `stage.ts` hook.
- [ ] **Step 4: Run** the test and `npx vitest run src/render/world` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): animals start on free pen cells without overlapping`

### Task 5.2: Walks that stay on free cells and clear of other animals

**Files:**
- Modify: `src/render/world/animalBrain.ts`, `src/render/world/Animal.tsx`
- Test: `src/render/world/animalBrain.test.ts`

**Interfaces:**
- Consumes: `BODY_RADIUS`, `AnimalSpawn.walk` (5.1), `distanceToSegment`, `segmentDistance`.
- Produces:
  - `Course` gains `radius: number`
  - `nextWalkTarget(random: () => number, walk: Vec2[], from: Vec2, radius: number, others: Course[], minStep = 1.2, cell = 0.25): Vec2` — candidate from `walk`, at least `minStep` away; accepted only when every sample every `cell / 2` along `from → candidate` is within `cell * 0.75` of some `walk` cell (lookup by cell key, not a scan), the candidate keeps `radius + other.radius` from every other course segment, and the walk keeps that same gap from every other course; returns `from` when nothing fits after 40 tries
  - `Animal.tsx` calls `nextWalkTarget` when `spawn.walk` exists (falling back to `nextTarget` otherwise) and stores `radius = BODY_RADIUS[species] * scale` in its occupancy entries

- [ ] **Step 1: Write the failing tests**

```ts
const walk = Array.from({ length: 24 * 24 }, (_, index) => ({ x: -3 + (index % 24) * 0.25 + 0.125, z: -3 + Math.floor(index / 24) * 0.25 + 0.125 })).filter((cell) => !(cell.x > -0.5 && cell.x < 0.5 && cell.z > -0.5 && cell.z < 0.5))

it('only walks across free cells of the pen', () => {
  const random = createRandom(2)
  for (let run = 0; run < 50; run += 1) {
    const target = nextWalkTarget(random, walk, { x: -2, z: -2 }, 0.4, [])
    for (let t = 0; t <= 1; t += 0.05) expect(walk.some((cell) => Math.hypot(cell.x - (-2 + (target.x + 2) * t), cell.z - (-2 + (target.z + 2) * t)) <= 0.19)).toBe(true)
  }
})
it('never walks through another animal standing or walking', () => {
  const random = createRandom(3)
  const other: Course = { from: { x: 0, z: 2 }, to: { x: 0, z: 2 }, radius: 0.55 }
  for (let run = 0; run < 50; run += 1) {
    const target = nextWalkTarget(random, walk, { x: -2, z: 2 }, 0.55, [other])
    expect(segmentDistance({ x: -2, z: 2 }, target, other.from, other.to)).toBeGreaterThanOrEqual(1.1 - 1e-9)
  }
})
it('stays put when boxed in', () => {
  expect(nextWalkTarget(createRandom(1), [{ x: 0.125, z: 0.125 }], { x: 0.125, z: 0.125 }, 0.4, [])).toEqual({ x: 0.125, z: 0.125 })
})
```

- [ ] **Step 2: Run** `npx vitest run src/render/world/animalBrain.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `nextWalkTarget`, the `radius` on `Course`, and the `Animal.tsx` switch.
- [ ] **Step 4: Run** `npx tsc --noEmit -p tsconfig.json && npx vitest run src/render/world` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): animals walk only on free pen cells and never through each other`
