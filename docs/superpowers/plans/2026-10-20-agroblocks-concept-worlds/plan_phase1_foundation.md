# Phase 1 — Foundation (Tasks 1–4)

See `plan_index.md` for Goal, Global Constraints and Review Focus.

### Task 1: World registry and mission model

**Files:**
- Create: `src/game/worlds/worldTypes.ts`, `src/data/worlds.ts`, `src/game/worlds/missionLabel.ts`
- Modify: `src/game/missions/missionTypes.ts`, `src/game/progress/types.ts` (`MissionRef`), `src/data/missions/index.ts`, all files in `src/data/missions/` (rename + move, see table), every import of the old ids in `src/` and `tests/`
- Test: `src/game/worlds/worlds.test.ts`, `src/data/missions/missions.test.ts` (adapt)

**Interfaces:**
- Produces:
  - `type WorldId = 'garden' | 'cornfield' | 'orchard' | 'greenhouse' | 'barnyard' | 'homestead'`
  - `const WORLD_IDS: readonly WorldId[]` in that order
  - `type MissionRole = 'learn' | 'practice' | 'challenge' | 'debug' | 'final'`
  - `function roleForSlot(slot: number): MissionRole` — 1–3 learn, 4–6 practice, 7–8 challenge, 9 debug, 10 final
  - `const ROLE_LABELS: Record<MissionRole, string>` = `{ learn: 'Conhecer', practice: 'Praticar', challenge: 'Apertar', debug: 'Consertar', final: 'Desafio final' }`
  - `interface WorldDefinition { id: WorldId; order: number; name: string; concept: Exclude<MissionConcept, 'interface'>; conceptLabel: string; keyBlock: BlockType | null }` and `WORLDS: WorldDefinition[]`, `getWorld(id: WorldId): WorldDefinition`, `missionsOfWorld(world: WorldId, missions: MissionDefinition[]): MissionDefinition[]` (sorted by slot) in `src/data/worlds.ts`
  - `MissionDefinition` gains `world: WorldId | null` and `slot: number | null`; `rules` gains `maxBlocks?: number`
  - `MissionRef` becomes `{ id: string; order: number; world: WorldId | null }`
  - Mission ids: `m0-training` unchanged; world missions `${world}-${slot two digits}` (e.g. `garden-04`); global `order` = `(worldOrder - 1) * 10 + slot`, training `0`
  - `function missionLabel(mission: MissionDefinition): string` → `'Treinamento'` or `` `${world.name} · Missão ${slot}` ``
  - Mission files live in `src/data/missions/<world>/<world><NN>.ts` exporting `const <world><NN>`; each world folder has `index.ts` exporting `<WORLD>_MISSIONS: MissionDefinition[]`

World table (copy exactly):

| order | id | name | concept | conceptLabel | keyBlock |
|---|---|---|---|---|---|
| 1 | garden | Horta | sequencing | Sequência | null |
| 2 | cornfield | Milharal | repetition | Repetição | controls_repeat_ext |
| 3 | orchard | Pomar | conditionals | Condições | controls_if |
| 4 | greenhouse | Estufa | sensors | Sensores | controls_whileUntil |
| 5 | barnyard | Celeiro | variables | Variáveis | variables_set |
| 6 | homestead | Fazenda completa | efficiency | Eficiência | procedures_defnoreturn |

Old missions move unchanged in content (only `id`, `order`, `world`, `slot`, file name change):

| old id | new id |
|---|---|
| m1-first-harvest | garden-04 |
| m2-row-planting | cornfield-02 |
| m3-smart-irrigation | orchard-04 |
| m4-auto-harvest | greenhouse-03 |
| m5-limited-resources | barnyard-05 |
| m6-efficient-farm | homestead-10 |

- [ ] **Step 1: Write the failing tests**

`src/game/worlds/worlds.test.ts`:
```ts
it('lists the six worlds in order with their names and concepts', () => {
  expect(WORLDS.map((world) => [world.id, world.order, world.name])).toEqual([
    ['garden', 1, 'Horta'], ['cornfield', 2, 'Milharal'], ['orchard', 3, 'Pomar'],
    ['greenhouse', 4, 'Estufa'], ['barnyard', 5, 'Celeiro'], ['homestead', 6, 'Fazenda completa'],
  ])
})
it('maps slots to roles', () => {
  expect([1, 3, 4, 6, 7, 8, 9, 10].map(roleForSlot)).toEqual(['learn', 'learn', 'practice', 'practice', 'challenge', 'challenge', 'debug', 'final'])
})
it('labels missions by world and slot', () => {
  expect(missionLabel(getMission('garden-04')!)).toBe('Horta · Missão 4')
  expect(missionLabel(getMission('m0-training')!)).toBe('Treinamento')
})
```

In `missions.test.ts` replace the "seven missions" test with:
```ts
it('keeps ids unique, orders derived from world and slot, training first', () => {
  expect(new Set(MISSIONS.map((item) => item.id)).size).toBe(MISSIONS.length)
  expect(MISSIONS[0].id).toBe('m0-training')
  for (const item of MISSIONS.filter((mission) => mission.world)) {
    expect(item.order).toBe((getWorld(item.world!).order - 1) * 10 + item.slot!)
    expect(item.id).toBe(`${item.world}-${String(item.slot).padStart(2, '0')}`)
    expect(item.concept).toBe(getWorld(item.world!).concept)
  }
})
```
Rename old ids in the specific-mission tests of `missions.test.ts` per the table.

- [ ] **Step 2: Run** `npx vitest run src/game/worlds src/data/missions` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement** the files and the moves above; `getNextMission(id)` returns the next mission by `order` among existing missions (not `order + 1`), since slots fill in over Phase 2. Fix every reference to old ids (`grep -rn "m[1-6]-[a-z]" src tests`).

- [ ] **Step 4: Run** `npx tsc --noEmit -p . && npx vitest run --maxWorkers=2` — Expected: PASS.

- [ ] **Step 5: Commit** `git commit -m "feat(worlds): world registry and missions grouped by world and slot"`

### Task 2: Save version 2 and unlock rules

**Files:**
- Modify: `src/game/progress/types.ts`, `src/game/progress/progression.ts`, `src/services/storage/saveDataSchema.ts`, `src/services/storage/saveStorage.ts`, `src/stores/progressStore.ts`
- Test: `src/game/progress/progression.test.ts`, `src/services/storage/saveStorage.test.ts`

**Interfaces:**
- Consumes: `WorldId`, `WORLD_IDS`, `MissionRef` (Task 1)
- Produces:
  - `AssessmentResponse` gains `world: WorldId` (keeps `form`, `startedAt`, `completedAt`, `skipped`, `answers`)
  - `interface WorldAssessments { pre: AssessmentResponse | null; post: AssessmentResponse | null }`
  - `SaveData.version: 2`; `SaveData.assessments: Record<WorldId, WorldAssessments>`
  - `function emptyAssessments(): Record<WorldId, WorldAssessments>`
  - `function refreshUnlocks(save: SaveData, missions: MissionRef[]): SaveData` — the only place that turns `locked` into `available`; never turns anything back to `locked`
  - `storeAssessment(save, response, missions)` now takes `missions` and calls `refreshUnlocks`
  - `type WorldStep = { kind: 'preTest' } | { kind: 'mission'; missionId: string } | { kind: 'postTest' } | { kind: 'done' }`
  - `function worldStep(save: SaveData, world: WorldId, missions: MissionRef[]): WorldStep`
  - `function isWorldOpen(save: SaveData, world: WorldId, missions: MissionRef[]): boolean`
  - `function currentWorld(save: SaveData, missions: MissionRef[]): WorldId` — first open world whose step is not `done`, else `homestead`
  - `continueMissionId` unchanged signature; skips worlds whose step is `preTest`/`postTest`
  - `function migrateSave(raw: unknown, missions: MissionRef[], now: string): SaveData | null` — version 1 → version 2 keeping `runId`, `student`, `tutorial`, `createdAt`, the progress of `m0-training`; everything else starts fresh

Unlock rule (exact): training is always `available`. A world mission is unlockable when its world is open and every earlier mission of the same world (by `slot`) is `completed`. World 1 is open from the start. World k > 1 is open when the post-test of world k−1 is stored.

- [ ] **Step 1: Write the failing tests** (names and assertions)

```ts
it('opens the next world only after the previous post-test', () => {
  let save = completeWorld(createInitialSave(REFS, 'now'), 'garden')
  expect(isWorldOpen(save, 'cornfield', REFS)).toBe(false)
  expect(worldStep(save, 'garden', REFS)).toEqual({ kind: 'postTest' })
  save = storeAssessment(save, response('garden', 'post'), REFS)
  expect(isWorldOpen(save, 'cornfield', REFS)).toBe(true)
  expect(save.missions['cornfield-01'].status).toBe('available')
})
it('asks for the pre-test before the first mission of an open world', () => {
  const save = createInitialSave(REFS, 'now')
  expect(worldStep(save, 'garden', REFS)).toEqual({ kind: 'preTest' })
})
it('points to the post-test when missions are done', () => {
  const save = completeWorld(withPre(createInitialSave(REFS, 'now'), 'garden'), 'garden')
  expect(currentWorld(save, REFS)).toBe('garden')
  expect(worldStep(save, 'garden', REFS)).toEqual({ kind: 'postTest' })
})
it('never relocks', () => {
  const save = completeWorld(withPre(createInitialSave(REFS, 'now'), 'garden'), 'garden')
  const again = recordAttempt(save, failedAttempt('garden-03'), REFS)
  expect(again.missions['garden-03'].status).toBe('completed')
})
```
`saveStorage.test.ts`:
```ts
it('migrates a version 1 save', () => {
  storage.setItem(SAVE_KEY, JSON.stringify(versionOneSave))
  const save = loadSave(storage, REFS, 'now')
  expect(save.version).toBe(2)
  expect(save.runId).toBe(versionOneSave.runId)
  expect(save.student).toEqual(versionOneSave.student)
  expect(storage.getItem(CORRUPT_KEY)).toBeNull()
  expect(save.assessments.garden).toEqual({ pre: null, post: null })
})
```
`REFS` are built from `MISSIONS`; `completeWorld`, `withPre`, `response`, `failedAttempt` are local test helpers. `versionOneSave` is the old shape (`version: 1`, `assessments: { pre, post }`, ids `m1-first-harvest`…).

- [ ] **Step 2: Run** `npx vitest run src/game/progress src/services/storage` — Expected: FAIL.
- [ ] **Step 3: Implement.** `loadSave` first tries `saveDataSchema` (v2); on failure tries `migrateSave`; only if both fail it stores the raw value under `CORRUPT_KEY`. Update `progressStore.storeAssessment` to pass `MISSIONS`.
- [ ] **Step 4: Run** `npx tsc --noEmit -p . && npx vitest run --maxWorkers=2` — Expected: PASS (fix callers of `storeAssessment` and `save.assessments.pre/post`; AssessmentPage and dashboard callers may use a temporary `garden` world until Tasks 12 and 18).
- [ ] **Step 5: Commit** `git commit -m "feat(progress): save version 2 with per-world tests and world unlocking"`

### Task 3: Per-world assessment model

**Files:**
- Modify: `src/game/assessment/types.ts`, `src/game/assessment/scoring.ts`, `src/data/assessment/items.ts` (becomes the aggregator)
- Create: `src/data/assessment/garden.ts`, `cornfield.ts`, `orchard.ts`, `greenhouse.ts`, `barnyard.ts`, `homestead.ts` (each exports `<WORLD>_ITEMS: AssessmentItem[]`, filled in Phase 2; this task moves the existing 20 items into the world files that match their concept as a starting point)
- Test: `src/data/assessment/items.test.ts`, `src/game/assessment/scoring.test.ts`

**Interfaces:**
- Produces:
  - `type AssessmentSkill = 'build' | 'predict' | 'debug'` and `SKILL_LABELS: Record<AssessmentSkill, string>` = `{ build: 'Montar', predict: 'Prever', debug: 'Consertar' }`
  - `AssessmentItem` replaces `concept` with `world: WorldId` and `skill: AssessmentSkill` (keeps `id`, `pairId`, `variant`, `kind`, `prompt`, `code?`, `grid?`, `options`, `correctIndex`)
  - `function itemsFor(world: WorldId, form: AssessmentForm): AssessmentItem[]`
  - `function scoreResponse(response: AssessmentResponse): { correct: number; total: number } | null` (null when skipped)
  - `function scoreBySkill(response: AssessmentResponse): Record<AssessmentSkill, { correct: number; total: number }> | null`
  - `percent` unchanged
  - Item ids: `${world}-${pairNumber}-${variant}` (e.g. `cornfield-3-A`)

- [ ] **Step 1: Write the failing tests**
```ts
it.each(WORLD_IDS)('%s has ten paired items per form, 4 build, 3 predict, 3 debug', (world) => {
  for (const form of ['pre', 'post'] as const) {
    const items = itemsFor(world, form)
    expect(items).toHaveLength(10)
    expect(items.filter((item) => item.skill === 'build')).toHaveLength(4)
    expect(items.filter((item) => item.skill === 'predict')).toHaveLength(3)
    expect(items.filter((item) => item.skill === 'debug')).toHaveLength(3)
  }
})
```
Keep the existing pairing, unique-id and valid-answer tests over `ASSESSMENT_ITEMS`. Mark the per-world count test `it.todo` until each Phase 2 task turns its world on (each world task replaces the todo entry for its world with the real check by adding the world id to a `READY_WORLDS` list the test iterates).
`scoring.test.ts`: `scoreResponse` counts correct answers for a `cornfield` pre response; returns null when `skipped`.

- [ ] **Step 2–4:** run, implement, run (`npx vitest run src/data/assessment src/game/assessment`).
- [ ] **Step 5: Commit** `git commit -m "feat(assessment): items grouped by world and skill"`

### Task 4: Run snapshot and server

**Files:**
- Modify: `src/shared/runSnapshot.ts`, `src/shared/snapshotFixture.ts`, `src/services/sync/toSnapshot.ts`
- Test: `src/shared/runSnapshot.test.ts`, `server/handlers.test.ts`

**Interfaces:**
- Consumes: `SaveData` v2 (Task 2)
- Produces: `RunSnapshot.assessments: Record<WorldId, { pre: SnapshotAssessment | null; post: SnapshotAssessment | null }>` where `SnapshotAssessment` = current assessment shape plus `world`. `src/shared` cannot import `@/…`: define `const WORLD_ID_VALUES = ['garden', 'cornfield', 'orchard', 'greenhouse', 'barnyard', 'homestead'] as const` locally in `runSnapshot.ts` and add a test in `src/game/worlds/worlds.test.ts` asserting it equals `WORLD_IDS`.

- [ ] **Step 1: Write the failing tests**
```ts
it('accepts per-world assessments and rejects the old pre/post shape', () => {
  expect(runSnapshotSchema.safeParse(validSnapshot).success).toBe(true)
  expect(runSnapshotSchema.safeParse({ ...validSnapshot, assessments: { pre: null, post: null } }).success).toBe(false)
})
```
`server/handlers.test.ts`: `POST /api/runs` with the old assessment shape answers `400`.

- [ ] **Step 2–4:** run, implement, run `npx vitest run src/shared server src/services/sync`.
- [ ] **Step 5: Commit** `git commit -m "feat(sync): run snapshots carry per-world tests"`
