# Phase 4 — Estufa and Celeiro

Read `plan_index.md` and the shared contract in `plan_phase3_garden_orchard.md` (Task 10).

### Task 13: Greenhouse objects

**Files:**
- Create: `src/render/world/features/greenhouseObjects.ts`
- Modify: `worldTypes.ts` (`greenhouseBay`, `supportShed`, `waterTank`, `sprinkler`), `featureGeometry.ts` (`greenhouseBay` has glass via `featureGlass`), `worldCatalog.ts` (footprints 1.6 / 1.5 / 0.8 / 0.2; `greenhouseBay`, `supportShed`, `waterTank` tall), `InstancedFeatures.tsx` (`SPINNING` set = `sprinkler`: instances rotate around y at 2 rad/s when `ambient`)

Shapes (real reference: gutter-connected commercial greenhouses): `greenhouseBay` one 3.0 × 2.0 module — white frame posts `#eef3f1`, glass walls and a pointed roof (glass parts), rows of seedlings `#6fae4a` inside; built so bays placed 3.0 apart along x read as one continuous block. `supportShed` white box `#f1f1ea` with green roof `#3f8f5a` and a roll-up door `#b9c2c8`. `waterTank` cylinder `#7fb7c9` on a 4-leg stand, ~3 tall. `sprinkler` thin pipe + rotating arm.

- [ ] Steps as Task 9. Commit `feat(render): greenhouse bays, support shed, water tank and sprinklers`.

### Task 14: Greenhouse map and farm

**Files:**
- Create: `src/render/world/landscapes/greenhouseLandscape.ts`, `greenhouseLandscape.test.ts`
- Modify: `landscapes.ts`

Composition (style: flat, almost geometric, meshFence border, cool clean light, gravel paths):
- **Map**: landmark = one block of 4–6 `greenhouseBay` side by side (consecutive bays exactly 3.0 apart, same rotation) with a `supportShed` at one end and a `waterTank` beside it; 1–2 seedling blocks (`vegetableBed`, soil `#8a6448`) with 2–4 `sprinkler`s; gravel yard patch `#d9d2c3` in front of the shed; island border `meshFence`.
- **Farm**: a bay block of 3–4 behind the grid with the shed at its end, water tank in the back corner, a seedling block on the left with sprinklers, `meshFence` border with a gap.

- [ ] **Step 1: Write failing tests**: `describeLandscape({ world: 'greenhouse', landmark: ['greenhouseBay', 'supportShed', 'waterTank'], crops: ['vegetableBed'], minBlocks: { map: 2, farm: 1 } })` — the crop check also covers bays: add `greenhouseBay` to `crops` only if it sits on a patch; otherwise test separately: `bays form one row` (map ≥ 4 bays, farm ≥ 3, sorted along their axis each 3.0 ± 0.01 apart, equal rotation).
- [ ] **Step 2:** run — Expected: FAIL. **Step 3:** implement. **Step 4:** `npx vitest run src/render && npx tsc --noEmit -p .` + perf spec — Expected: PASS. **Step 5:** commit `feat(render): greenhouse map and mission scene as a greenhouse block`.

### Task 15: Barnyard objects

**Files:**
- Create: `src/render/world/features/barnyardObjects.ts`
- Modify: `worldTypes.ts` (`feedShed`, `baleStack`), `featureGeometry.ts`, `worldCatalog.ts` (footprints 1.5 / 1.0; `feedShed` tall)

Shapes: `feedShed` open-front lean-to `#8a5a3c` with a slanted roof `#6b6f73` and a row of feed sacks `#e8dcc0`; `baleStack` 3-2-1 pyramid of 6 round bales `#e2c46a` (merged, so one instance per stack).

- [ ] Steps as Task 9. Commit `feat(render): feed shed and bale stacks for the barnyard`.

### Task 16: Barnyard map and farm

**Files:**
- Create: `src/render/world/landscapes/barnyardLandscape.ts`, `barnyardLandscape.test.ts`
- Modify: `landscapes.ts`

Composition (style: flat, woodFence border, warm light):
- **Map**: landmark = `barn` model with `silo` and `feedShed` joined to it (all within 4 of each other) and 2 `baleStack`s; 2 near-square paddocks (aspect between 0.75 and 1.33) on trail-free parcels, patch `#8fcf63`, fenced with `fenceRect`, herds `[['cow', 3], ['horse', 2]]` and `[['sheep', 4], ['pig', 2]]`, 1 `trough` inside each; the `windmill` model near the paddocks (it spins through the existing ambient props if `SpinningProp` covers it — check `ambientLoops.ts`; if not, add it there); island border `woodFence`.
- **Farm**: barn + silo + feed shed behind the grid; one paddock on the left with cows and a trough; bale stacks and the path in front; woodFence border with a gate gap.
- Barnyard lists `barn` and `silo` in `landmark`; it keeps animals (the contract's "no animals" check does not apply; the contract only forbids base-farm models not in `landmark`).

- [ ] **Step 1: Write failing tests**: `describeLandscape({ world: 'barnyard', landmark: ['barn', 'silo', 'feedShed'], crops: [], minBlocks: { map: 2, farm: 1 } })` plus `paddocks are square and stocked` (every pasture patch aspect in [0.75, 1.33]; every animal inside a paddock; one `trough` inside each paddock).
- [ ] **Step 2:** run — Expected: FAIL. **Step 3:** implement. **Step 4:** `npx vitest run src/render && npx tsc --noEmit -p .` + perf spec — Expected: PASS. **Step 5:** commit `feat(render): barnyard map and mission scene with barn and paddocks`.
