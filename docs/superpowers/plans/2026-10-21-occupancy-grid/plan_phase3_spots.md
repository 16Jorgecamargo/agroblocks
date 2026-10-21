# Phase 3 — Work spots

Read `plan_index.md` first (Global Constraints apply).

### Task 3.1: Spots where each task makes sense

**Files:**
- Create: `src/render/world/navigation/workSpots.ts`
- Test: `src/render/world/navigation/workSpots.test.ts`

**Interfaces:**
- Consumes: `World`, `ActorTask`, `FEATURE_SHAPES` (1.2), `WalkMask`, `isOpen` (2.1), `headingAlong` (`actors/actorMotion.ts`).
- Produces:
  - `type WorkTask = Exclude<ActorTask, 'walk' | 'drive'>`
  - `interface WorkSpot { at: Vec2; facing: number; task: WorkTask; target: Vec2 }`
  - `TASK_TARGETS: Record<WorkTask, readonly FeatureKind[]>`:
    - `water`, `hoe`: every `*Bed`, `beanTrellis`, `berryBush`, `sapling`
    - `pick`: `orchardLadder`
    - `feed`: `trough`, `hayRack`
    - `tend`: `workbench`, `seedlingTable`, `sortingTable`, `controlStation`, `equipmentRack`, `grainAuger`, `supplyTank`, `compostBins`
    - `carry`: `baleStack`, `crateStack`, `sackPallet`, `harvestBin`
  - `workSpots(world: World, person: WalkMask, task: WorkTask, area?: Rect): WorkSpot[]` — for each target feature (inside `area` when given), candidate feet at the 8 compass points around its rotated shape at `half extent + 0.35`; keep those with `isOpen(person, at)`; `facing = headingAlong(at, target)`; sorted by target x, target z, then angle

- [ ] **Step 1: Write the failing tests**

```ts
const map = (theme: WorldId) => buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme })

it('waters only next to a bed, facing it, on walkable ground', () => {
  const world = map('garden'); const person = walkMask(buildOccupancy(world), 'person')
  const spots = workSpots(world, person, 'water')
  expect(spots.length).toBeGreaterThan(10)
  for (const spot of spots) {
    expect(isOpen(person, spot.at)).toBe(true)
    expect(Math.hypot(spot.at.x - spot.target.x, spot.at.z - spot.target.z)).toBeLessThan(1.4)
    expect(Math.cos(spot.facing - headingAlong(spot.at, spot.target))).toBeCloseTo(1, 5)
  }
})
it('feeds beside a trough or hay rack', () => {
  const world = map('barnyard'); const spots = workSpots(world, walkMask(buildOccupancy(world), 'person'), 'feed')
  expect(spots.length).toBeGreaterThan(0)
  for (const spot of spots) expect(world.features.some((feature) => (feature.kind === 'trough' || feature.kind === 'hayRack') && feature.x === spot.target.x && feature.z === spot.target.z)).toBe(true)
})
it('limits spots to an area', () => {
  const world = map('garden'); const area = { minX: -12.4, maxX: -4.6, minZ: -12.4, maxZ: -7.3 }
  for (const spot of workSpots(world, walkMask(buildOccupancy(world), 'person'), 'hoe', area)) expect(spot.target.x >= area.minX && spot.target.x <= area.maxX && spot.target.z >= area.minZ && spot.target.z <= area.maxZ).toBe(true)
})
it('finds nothing when no target exists', () => {
  const world = map('cornfield'); expect(workSpots(world, walkMask(buildOccupancy(world), 'person'), 'pick')).toEqual([])
})
```

- [ ] **Step 2: Run** `npx vitest run src/render/world/navigation/workSpots.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement `workSpots.ts`.**
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): work spots beside the objects each task needs`
