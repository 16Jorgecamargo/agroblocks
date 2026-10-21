# Phase 6 — Contract, dev viewer, perf, ADR

Read `plan_index.md` first (Global Constraints apply).

### Task 6.1: Contract tests in every world

**Files:**
- Modify: `src/render/world/landscapes/landscapeContract.ts`
- Test: runs through the six `*Landscape.test.ts`

**Interfaces:**
- Consumes: `buildOccupancy`, `walkMask`, `segmentClear`, `isOpen`, `TASK_TARGETS`, `FEATURE_SHAPES`, `BODY_RADIUS`.
- Adds to `describeLandscape`, for the map and every mission grid size in `sizes`, in both `density: 'full'` and `'light'`:

```ts
it('moves people and tractors only through cells open to them', () => {
  for (const world of scenes) {
    const grid = buildOccupancy(world)
    for (const actor of world.actors ?? []) {
      const mask = walkMask(grid, actor.kind === 'tractor' ? 'tractor' : 'person')
      expect(isOpen(mask, actor.route[0]), actor.id).toBe(true)
      for (let index = 1; index < actor.route.length; index += 1) expect(segmentClear(mask, actor.route[index - 1], actor.route[index]), actor.id).toBe(true)
    }
  }
})
it('works only beside the object its task needs', () => {
  for (const world of scenes) for (const actor of (world.actors ?? []).filter((item) => item.kind === 'worker' && item.task !== 'walk')) {
    const ends = actor.route.length === 1 ? [actor.route[0]] : [actor.route[0], actor.route[actor.route.length - 1]]
    for (const end of ends) expect(world.features.some((feature) => TASK_TARGETS[actor.task as WorkTask].includes(feature.kind) && Math.hypot(feature.x - end.x, feature.z - end.z) < 2.6), actor.id).toBe(true)
  }
})
it('keeps every animal on free pen cells, apart from the others', () => {
  for (const world of scenes) {
    const mask = walkMask(buildOccupancy(world), 'animal')
    for (const animal of world.animals) expect(isOpen(mask, animal)).toBe(true)
    world.animals.forEach((a, i) => world.animals.slice(i + 1).forEach((b) => expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(BODY_RADIUS[a.species] * a.scale + BODY_RADIUS[b.species] * b.scale - 1e-9)))
  }
})
```

The existing "never on the mission grid" test stays.

- [ ] **Step 1: Add the tests.**
- [ ] **Step 2: Run** `npx vitest run src/render/world/landscapes` — Expected: PASS. A failure means a job or pen in that world is wrong: fix the job's `area`/`via` or the pen, never the test.
- [ ] **Step 3: Commit** `test(render): every world keeps people, tractors and animals on open ground`

### Task 6.2: Dev-only viewer, perf and ADR

**Files:**
- Create: `dev/occupancy.html`, `dev/occupancy.tsx` (served by `npm run dev` at `/dev/occupancy.html?world=<id>&layout=map|farm&w=5&h=3`; not part of `vite build`, which only bundles `index.html`)
- Create: `docs/decisions/0015-occupancy-grid.md`

**Interfaces:**
- Consumes: `buildWorld`, `buildOccupancy`, `walkMask`, `OCCUPANTS`.
- The viewer draws, on a 2D `<canvas>`, one pixel block per cell coloured by occupant, person-mask closed cells hatched, actor routes as lines, work spots as dots, animal `walk` cells tinted.

- [ ] **Step 1: Build the viewer.** Verify by opening `/dev/occupancy.html?world=barnyard` in `npm run dev`: fences, troughs, markers and the barn show as blocked, routes run only over open cells.
- [ ] **Step 2: Verify the production build ignores it:** `npm run build` — Expected: success, and `dist/` contains no `occupancy` file (`ls dist | grep -c occupancy` → `0`).
- [ ] **Step 3: Perf:** `npx playwright test tests/e2e/landscapePerf.spec.ts --workers=1` — Expected: 6 passed, map ≤ 310 and farm ≤ 390 draw calls.
- [ ] **Step 4: Write ADR 0015** (Portuguese, same shape as 0014): context, decision (grid, masks, spots, jobs, animal walks), consequences (contract tests, viewer, a world change can drop actors whose job no longer fits).
- [ ] **Step 5: Run** `npx tsc --noEmit -p tsconfig.json && npx vitest run` — Expected: all pass.
- [ ] **Step 6: Commit** `docs: occupancy grid decision and dev viewer`
