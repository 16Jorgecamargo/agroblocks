# Phase 4 — Jobs become actor routes

Read `plan_index.md` first (Global Constraints apply). Do not edit `actorGeometry.ts`, `workerPose.ts` or `Actors.tsx`.

### Task 4.1: Plan actors from jobs

**Files:**
- Create: `src/render/world/navigation/planActors.ts`
- Modify: `src/render/world/worldTypes.ts` (add `facings?: [number, number]` to `Actor`), `src/render/world/actors/actorMotion.ts` (pause at the start uses `facings[0]`, at the end `facings[1]`, falling back to `facing` and then to the travel direction)
- Test: `src/render/world/navigation/planActors.test.ts`, extend `src/render/world/actors/actorMotion.test.ts`

**Interfaces:**
- Consumes: `buildOccupancy` (1.3), `walkMask`, `findPath`, `segmentClear` (2.x), `workSpots`, `WorkTask` (3.1).
- Produces:
  - `type Job = { id: string; kind: 'worker'; task: WorkTask; shirt: number; area?: Rect; stops?: 1 | 2 } | { id: string; kind: 'walker'; shirt: number; via: Vec2[] } | { id: string; kind: 'tractor'; via: Vec2[] }`
  - `planActors(world: World, grid: OccupancyGrid, jobs: Job[], random: () => number): Actor[]`
    - worker, `stops` 1 (default): one spot picked with `random`; route `[spot.at]`, `facing = spot.facing`
    - worker, `stops` 2: two spots on different targets at least 2 apart (for `carry`, two different load objects), route = `findPath(person, a.at, b.at)`, `facings: [a.facing, b.facing]`
    - walker: chain `findPath(person, …)` through `via`, task `'walk'`
    - tractor: chain `findPath(tractor, …)` through `via`, task `'drive'`, `kind: 'tractor'`
    - any job with no spot or no path is skipped
    - shirt colours: the `SHIRTS` list now in `landscapes/cast.ts`, moved into this file

- [ ] **Step 1: Write the failing tests**

```ts
const map = (theme: WorldId) => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme })
const legsClear = (mask: WalkMask, route: Vec2[]) => route.every((point, index) => index === 0 || segmentClear(mask, route[index - 1], point))

it('turns a watering job into a route between two beds that never crosses anything', () => {
  const world = map('garden'); const grid = buildOccupancy(world)
  const [actor] = planActors(world, grid, [{ id: 'w', kind: 'worker', task: 'water', shirt: 1, stops: 2 }], createRandom(1))
  expect(actor.task).toBe('water'); expect(actor.facings).toHaveLength(2)
  expect(legsClear(walkMask(grid, 'person'), actor.route)).toBe(true)
})
it('drives a tractor only where the tractor fits, around mission markers', () => {
  const world = map('cornfield'); const grid = buildOccupancy(world)
  const [tractor] = planActors(world, grid, [{ id: 't', kind: 'tractor', via: [{ x: -3.7, z: 4.8 }, { x: -12, z: -1.95 }] }], createRandom(1))
  expect(tractor.kind).toBe('tractor')
  expect(legsClear(walkMask(grid, 'tractor'), tractor.route)).toBe(true)
})
it('drops a job with nothing to work on', () => {
  const world = map('cornfield')
  expect(planActors(world, buildOccupancy(world), [{ id: 'p', kind: 'worker', task: 'pick', shirt: 0 }], createRandom(1))).toEqual([])
})
it('is the same cast on every build', () => {
  const world = map('orchard'); const jobs: Job[] = [{ id: 'p', kind: 'worker', task: 'pick', shirt: 0 }]
  expect(planActors(world, buildOccupancy(world), jobs, createRandom(4))).toEqual(planActors(world, buildOccupancy(world), jobs, createRandom(4)))
})
```

Add to `actorMotion.test.ts`:

```ts
it('faces the work at each end while pausing there', () => {
  const actor = { ...walker, facings: [1, -2] as [number, number] }
  expect(actorPose(actor, 1 - actorOffset(actor)).heading).toBe(1)
  expect(actorPose(actor, 7 - actorOffset(actor)).heading).toBe(-2)
})
```

- [ ] **Step 2: Run** `npx vitest run src/render/world/navigation/planActors.test.ts src/render/world/actors/actorMotion.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** `planActors.ts` and the `facings` support.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): actor routes planned on the occupancy grid`

### Task 4.2: Landscapes hand out jobs instead of routes

**Files:**
- Modify: `src/render/world/landscapes/stage.ts` (`StageParts.actors` → `StageParts.jobs?: Job[]`; after the world is composed: `actors: planActors(world, buildOccupancy(world), parts.jobs ?? [], random)`), the six `src/render/world/landscapes/*Landscape.ts`
- Delete: `src/render/world/landscapes/cast.ts`
- Test: existing landscape tests

**Interfaces:**
- Consumes: `Job`, `planActors` (4.1).
- Each current actor becomes a job with the same intent, using the district rects already in each file as `area`:
  - stationary workers → `{ kind: 'worker', task, stops: 1, area }` (bench → `tend` with the hub area; feeder → `feed` with the pen rect; pickers → `pick` with the grove rect)
  - walking waterers, hoers and carriers → `stops: 2` in their district
  - free walkers → `{ kind: 'walker', via }`, tractors → `{ kind: 'tractor', via }` with the current lane end points as `via`

- [ ] **Step 1: Run** `npx vitest run src/render/world` — Expected: PASS before the change (baseline).
- [ ] **Step 2: Switch** `stage.ts` and every landscape to jobs; delete `cast.ts`.
- [ ] **Step 3: Run** `npx tsc --noEmit -p tsconfig.json && npx vitest run src/render/world` — Expected: PASS; the contract's "brings people to work" test still finds ≥ 3 workers on each map and ≥ 2 actors on each farm (if a world falls short, widen that job's `area`, never relax the test).
- [ ] **Step 4: Commit** `refactor(render): landscapes cast jobs, the grid plans the routes`
