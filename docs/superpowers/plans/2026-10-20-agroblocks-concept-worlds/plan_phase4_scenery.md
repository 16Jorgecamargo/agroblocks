# Phase 4 — Scenery and missions screen (Tasks 14–17)

See `plan_index.md` for Goal, Global Constraints and Review Focus. Visual style: the existing low-poly look (decisions 0007, 0008, 0009). New objects are procedural meshes with flat materials, like `src/render/crops/CropPlant.tsx`.

### Task 14: World themes and procedural features

**Files:**
- Create: `src/render/world/worldThemes.ts`, `src/render/world/WorldFeatures.tsx`
- Modify: `src/render/world/worldTypes.ts`, `src/render/world/buildWorld.ts`, `src/render/world/WorldTerrain.tsx`, `src/render/world/worldPalette.ts`, every scene that renders a `World` (`FarmScene.tsx`, `HomeLandscape.tsx`, the celebration scene) to also render `<WorldFeatures />`
- Test: `src/render/world/worldThemes.test.ts`

**Interfaces:**
- Produces:
  - `WorldInput.theme: WorldId | null` (existing callers pass `null`)
  - `type FeatureKind = 'cornStalk' | 'fruitTree' | 'greenhouse' | 'vegetableBed' | 'hayBale' | 'trough'`
  - `interface WorldFeature { kind: FeatureKind; x: number; z: number; rotation: number; scale: number; tint?: string }`
  - `World.features: WorldFeature[]` and `World.palette: { grass: string; grassDeep: string; path: string }` (`WORLD_COLORS` values when `theme` is null)
  - `interface WorldTheme { palette: World['palette']; crop: CropKind; features: FeatureKind[]; props: ModelId[] }` and `WORLD_THEMES: Record<WorldId, WorldTheme>`
  - `function WorldFeatures({ features, ambient }: { features: WorldFeature[]; ambient: boolean })`

Theme content (copy):

| world | features | grass tone |
|---|---|---|
| garden | vegetableBed | green `#7cc35a` |
| cornfield | cornStalk, hayBale | golden `#cdbd62` |
| orchard | fruitTree | deep green `#6fb54e` |
| greenhouse | greenhouse, vegetableBed | teal green `#83c493` |
| barnyard | hayBale, trough | dry `#b9b071` |
| homestead | every kind | `WORLD_COLORS.grass` |

`CropKind` is defined in Task 15; in this task declare it in `src/render/crops/cropShape.ts` as `type CropKind = 'vegetable' | 'corn' | 'fruit' | 'seedling' | 'grain' | 'mixed'` with themes garden→vegetable, cornfield→corn, orchard→fruit, greenhouse→seedling, barnyard→grain, homestead→mixed.

- [ ] **Step 1: Write the failing tests**
```ts
it('keeps the current look without a theme', () => {
  const world = buildWorld({ layout: 'farm', gridWidth: 6, gridHeight: 3, seed: 's', density: 'full', theme: null })
  expect(world.features).toEqual([])
  expect(world.palette.grass).toBe(WORLD_COLORS.grass)
})
it.each(WORLD_IDS)('%s farm uses its own features and palette', (theme) => {
  const world = buildWorld({ layout: 'farm', gridWidth: 6, gridHeight: 3, seed: 's', density: 'full', theme })
  expect(world.features.length).toBeGreaterThan(0)
  for (const feature of world.features) expect(WORLD_THEMES[theme].features).toContain(feature.kind)
  expect(world.palette).toEqual(WORLD_THEMES[theme].palette)
})
it('keeps features off the playable grid', () => {
  const world = buildWorld({ layout: 'farm', gridWidth: 6, gridHeight: 3, seed: 's', density: 'full', theme: 'cornfield' })
  for (const feature of world.features) expect(Math.abs(feature.x) > 3 + GRID_CLEARANCE || Math.abs(feature.z) > 1.5 + GRID_CLEARANCE).toBe(true)
})
```
- [ ] **Step 2–4:** run `npx vitest run src/render/world`, implement (features placed through `WorldDraft` keep-out rules so they never overlap the grid, paths or props), run.
- [ ] **Step 5: Commit** `git commit -m "feat(render): world themes with their own palette and farm features"`

### Task 15: Themed crops and gameplay farm

**Files:**
- Modify: `src/render/crops/cropShape.ts`, `src/render/crops/CropPlant.tsx`, `src/render/farm3d/PlotTile.tsx`, `src/render/farm3d/FarmScene.tsx`, `src/render/FarmView.tsx` (pass the mission world down)
- Test: `src/render/crops/cropShape.test.ts`

**Interfaces:**
- Consumes: `WORLD_THEMES`, `WorldInput.theme` (Task 14)
- Produces: `cropShape(stage: CropStage, kind: CropKind = 'vegetable'): CropShape`; `CropPlant` and `PlotTile` take `crop: CropKind`; `FarmScene` builds its world with `theme: mission.world` and gives every `PlotTile` `WORLD_THEMES[world].crop` (`vegetable` for the training). `'mixed'` picks a kind per cell from its coordinates so neighbouring plots differ.

- [ ] **Step 1: Write the failing tests**
  - `corn grows taller and thinner than vegetables` — `cropShape('ready', 'corn').height > cropShape('ready', 'vegetable').height` and `.width <`.
  - `fruit crops carry red fruits when ready` — every fruit of `cropShape('ready', 'fruit')` has `color: 'red'` and there are at least 3.
  - `every kind has a shape for every stage` — no throw, `height > 0` for all 6 kinds × 3 stages.
  - `vegetable keeps the current shape` — `cropShape(stage, 'vegetable')` deep-equals the current `cropShape(stage)` output for every stage (snapshot the current values in the test before changing code).
- [ ] **Step 2–4:** run `npx vitest run src/render/crops`, implement, run; then check the game visually at `/#/jogar/cornfield-02` in `npm run dev`.
- [ ] **Step 5: Commit** `git commit -m "feat(render): crops and farm scenery follow the mission world"`

### Task 16: World map layouts with their own trails

**Files:**
- Create: `src/render/world/worldTrails.ts`, `src/render/world/worldMapLayout.ts`
- Modify: `src/render/world/worldTypes.ts` (`WorldLayout` adds `'worldMap'`), `src/render/world/buildWorld.ts`
- Delete: `src/render/world/mapLayout.ts`, `src/features/mission-select/missionMapLayout.ts` and their tests (replaced)
- Test: `src/render/world/worldTrails.test.ts`

**Interfaces:**
- Produces:
  - `WORLD_TRAILS: Record<WorldId, Vec2[]>` — 12 points each: index 0 pre-test, 1–10 missions, 11 post-test
  - `worldMapLayout(input: WorldInput, random: () => number): World` (requires `input.theme`), island `MAP_ISLAND` kept as `{ minX: -10.5, maxX: 10.5, minZ: -10.5, maxZ: 10.5 }` exported from `worldMapLayout.ts`; `world.trail` is the 12 trail points; the theme's features and props fill the island around the trail

Trail shapes (fix the idea, points are the implementer's): garden — gentle S between vegetable beds; cornfield — zig-zag back and forth through corn rows; orchard — loop around a central group of fruit trees; greenhouse — goes into the greenhouse and comes back out; barnyard — circles the barn and silo; homestead — long spiral passing a bit of every other world.

- [ ] **Step 1: Write the failing tests**
```ts
it.each(WORLD_IDS)('%s trail has 12 points inside the island, well spaced', (world) => {
  const trail = WORLD_TRAILS[world]
  expect(trail).toHaveLength(12)
  for (const point of trail) expect(Math.abs(point.x) < 9.5 && Math.abs(point.z) < 9.5).toBe(true)
  for (let index = 1; index < trail.length; index += 1) expect(Math.hypot(trail[index].x - trail[index - 1].x, trail[index].z - trail[index - 1].z)).toBeGreaterThanOrEqual(2.2)
})
it('gives every world a different trail', () => {
  const keys = WORLD_IDS.map((world) => JSON.stringify(WORLD_TRAILS[world]))
  expect(new Set(keys).size).toBe(6)
})
it.each(WORLD_IDS)('%s map keeps features away from the trail nodes', (theme) => {
  const world = buildWorld({ layout: 'worldMap', gridWidth: 0, gridHeight: 0, seed: theme, density: 'full', theme })
  for (const node of world.trail) for (const feature of world.features) expect(Math.hypot(feature.x - node.x, feature.z - node.z)).toBeGreaterThan(1.2)
})
```
- [ ] **Step 2–4:** run `npx vitest run src/render/world`, implement, run.
- [ ] **Step 5: Commit** `git commit -m "feat(render): one map per world with its own trail"`

### Task 17: Missions screen by world

**Files:**
- Create: `src/features/mission-select/WorldMapScene.tsx`, `src/features/mission-select/trailNodes.ts`, `src/features/mission-select/WorldDots.tsx`
- Modify: `src/features/mission-select/MissionSelectPage.tsx`, `src/features/mission-select/MissionDetailCard.tsx`, `src/features/mission-select/MissionSelectPage.css`
- Delete: `src/features/mission-select/MissionMapScene.tsx`
- Test: `src/features/mission-select/trailNodes.test.ts`, `src/features/mission-select/MissionSelectPage.test.tsx`

**Interfaces:**
- Consumes: `worldStep`, `isWorldOpen`, `currentWorld`, `missionsOfWorld`, `ROLE_LABELS`, `roleForSlot`, `assessmentPath`, `WORLD_TRAILS`, `buildWorld({ layout: 'worldMap', theme })`
- Produces:
  - `type TrailNode = { kind: 'preTest' } | { kind: 'mission'; mission: MissionDefinition } | { kind: 'postTest' }`
  - `function trailNodes(world: WorldId, missions: MissionDefinition[]): TrailNode[]` (12 nodes)
  - `type NodeState = 'done' | 'current' | 'open' | 'locked'`
  - `function nodeState(save: SaveData, world: WorldId, node: TrailNode, missions: MissionRef[]): NodeState` — `current` is the node matching `worldStep`; completed missions and stored tests are `done`; available missions that are not current are `open`
  - `WorldMapScene({ world, nodes, states, selected, onSelect, lowGraphics, ambient, onReady })` — 3D island from `buildWorld({ layout: 'worldMap', theme: world })`, node markers projected to HTML buttons like today's `LabelProjector`, colors done `#3fa34d`, current `#f2c14e`, open `#ffffff`, locked `#6b7177`; the final mission marker is a square with a star; the two test markers carry a clipboard/flag icon

Screen layout and copy (exact):
- Page title `Seus desafios`, subtitle `Cada mundo é uma fazenda. Siga a trilha e conclua as 10 missões para abrir o próximo.`
- World label top-left: `` `Mundo ${order}: ${name}` ``, line `` `${conceptLabel} · ${completed} de 10 missões` ``, progress bar
- Side buttons with `aria-label` `Mundo anterior` / `Próximo mundo`, disabled at the ends
- Dots below: one button per world, `aria-label` `` `${name}: ${state}` `` where state is `concluído`, `em andamento` or `fechado`; `aria-current="true"` on the shown world
- Closed world: veil with `` `Conclua o mundo ${previous.name} para abrir este` ``
- Card for a mission node: role label (`ROLE_LABELS`), `` `Missão ${slot} - ${title}` ``, goal text, button `Jogar` (`Jogar de novo` when done), disabled when locked
- Card for a test node: `Prova inicial` / `Prova final`, text `10 perguntas sobre ${conceptLabel.toLowerCase()}.`, link `Fazer a prova` to `assessmentPath`, disabled when locked; `Prova feita` when done
- Initial world: `currentWorld(save)`; initial selected node: the `current` node
- Without WebGL (`hasWebGL()` false): the same nodes as a flat ordered list inside the stage, keeping arrows, dots and card

- [ ] **Step 1: Write the failing tests**
  - `trailNodes` returns pre-test, missions 1–10 in slot order, post-test.
  - `nodeState`: fresh save → garden pre-test `current`, garden-01 `locked`; pre stored → garden-01 `current`; garden-01 done → garden-01 `done`, garden-02 `current`.
  - Page (jsdom, `hasWebGL` mocked false): opens on `Mundo 1: Horta`; `Próximo mundo` shows `Mundo 2: Milharal` and the veil `Conclua o mundo Horta para abrir este`; dot `Horta: em andamento` has `aria-current="true"`; clicking the pre-test node shows link `Fazer a prova` to `/avaliacao/garden/pre`; with garden pre stored the card of mission 1 shows `Conhecer` and `Jogar`.
- [ ] **Step 2–4:** run `npx vitest run src/features/mission-select`, implement, run; then check `/#/missoes` visually in `npm run dev` for all six worlds.
- [ ] **Step 5: Commit** `git commit -m "feat(missions): choose the world and follow its trail"`
