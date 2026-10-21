# Phase 2 — Masks, line of sight and A*

Read `plan_index.md` first (Global Constraints apply).

### Task 2.1: Agent masks

**Files:**
- Create: `src/render/world/navigation/passability.ts`
- Test: `src/render/world/navigation/passability.test.ts`

**Interfaces:**
- Consumes: `OccupancyGrid`, `Occupant` (Phase 1).
- Produces:
  - `type AgentKind = 'person' | 'tractor' | 'animal'`
  - `PASSABLE: Record<AgentKind, ReadonlySet<Occupant>>` — person `{free, road}`, tractor `{free, road}`, animal `{free}`
  - `CLEARANCE: Record<AgentKind, number>` — person `0.2`, tractor `0.8`, animal `0.35`
  - `interface WalkMask { grid: OccupancyGrid; open: Uint8Array }`, `walkMask(grid, agent: AgentKind): WalkMask` — a cell is open when every cell whose center is within `CLEARANCE[agent]` has a passable occupant
  - `isOpen(mask, point: Vec2): boolean`

- [ ] **Step 1: Write the failing tests**

```ts
it('lets people walk the road and free ground but not into beds or water', () => {
  const grid = createGrid({ minX: -4, maxX: 4, minZ: -4, maxZ: 4 })
  markRect(grid, { x: 0, z: 0 }, 1.4, 0.8, 0, 'crop'); markCircle(grid, { x: 3, z: 3 }, 0.6, 'water')
  const person = walkMask(grid, 'person')
  expect(isOpen(person, { x: 0, z: 0 })).toBe(false)
  expect(isOpen(person, { x: 0, z: 0.75 })).toBe(true)
  expect(isOpen(person, { x: 3, z: 3 })).toBe(false)
})
it('rejects a free gap too narrow for a person between two beds', () => {
  const grid = createGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
  markRect(grid, { x: 0, z: -0.5 }, 2, 0.8, 0, 'crop'); markRect(grid, { x: 0, z: 0.5 }, 2, 0.8, 0, 'crop')
  expect(isOpen(walkMask(grid, 'person'), { x: 0, z: 0 })).toBe(false)
})
it('keeps tractors further from obstacles than people', () => {
  const grid = createGrid({ minX: -4, maxX: 4, minZ: -4, maxZ: 4 })
  markRect(grid, { x: 0, z: 0 }, 1, 1, 0, 'structure')
  expect(isOpen(walkMask(grid, 'person'), { x: 0.9, z: 0 })).toBe(true)
  expect(isOpen(walkMask(grid, 'tractor'), { x: 0.9, z: 0 })).toBe(false)
})
it('keeps animals off roads, troughs and fences', () => {
  const grid = createGrid({ minX: -3, maxX: 3, minZ: -3, maxZ: 3 })
  markRect(grid, { x: 0, z: 0 }, 1.2, 0.5, 0, 'feed'); markSegment(grid, { x: -3, z: 2 }, { x: 3, z: 2 }, 0.15, 'fence')
  const animal = walkMask(grid, 'animal')
  expect(isOpen(animal, { x: 0, z: 0 })).toBe(false)
  expect(isOpen(animal, { x: 0, z: 1.9 })).toBe(false)
  expect(isOpen(animal, { x: -2, z: -2 })).toBe(true)
})
```

- [ ] **Step 2: Run** `npx vitest run src/render/world/navigation/passability.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement `passability.ts`** (dilate with a precomputed disc of cell offsets).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): walk masks for people, tractors and animals`

### Task 2.2: Line of sight and A*

**Files:**
- Create: `src/render/world/navigation/findPath.ts`
- Test: `src/render/world/navigation/findPath.test.ts`

**Interfaces:**
- Consumes: `WalkMask`, `isOpen` (2.1).
- Produces:
  - `segmentClear(mask: WalkMask, from: Vec2, to: Vec2): boolean` — samples every `cell / 2`
  - `findPath(mask: WalkMask, from: Vec2, to: Vec2): Vec2[] | null` — 8-direction A* over open cells (no diagonal step when either orthogonal neighbour is closed), octile heuristic, string-pulled with `segmentClear`; returns `[from, …, to]`, or `null` when an end is closed or no path exists

- [ ] **Step 1: Write the failing tests**

```ts
it('goes straight on open ground', () => {
  const mask = walkMask(createGrid({ minX: -5, maxX: 5, minZ: -5, maxZ: 5 }), 'person')
  expect(findPath(mask, { x: -4, z: 0 }, { x: 4, z: 0 })).toEqual([{ x: -4, z: 0 }, { x: 4, z: 0 }])
})
it('walks around a wall with every leg clear', () => {
  const grid = createGrid({ minX: -5, maxX: 5, minZ: -5, maxZ: 5 })
  markRect(grid, { x: 0, z: 0 }, 0.5, 6, 0, 'structure')
  const mask = walkMask(grid, 'person')
  const path = findPath(mask, { x: -3, z: 0 }, { x: 3, z: 0 })!
  expect(path.length).toBeGreaterThan(2)
  for (let index = 1; index < path.length; index += 1) expect(segmentClear(mask, path[index - 1], path[index])).toBe(true)
})
it('returns null when the goal is closed or unreachable', () => {
  const grid = createGrid({ minX: -5, maxX: 5, minZ: -5, maxZ: 5 })
  markSegment(grid, { x: 0, z: -5 }, { x: 0, z: 5 }, 0.3, 'fence')
  const mask = walkMask(grid, 'person')
  expect(findPath(mask, { x: -3, z: 0 }, { x: 3, z: 0 })).toBeNull()
  expect(findPath(mask, { x: -3, z: 0 }, { x: 0, z: 0 })).toBeNull()
})
it('bends around a mission marker on the road', () => {
  const grid = createGrid({ minX: -5, maxX: 5, minZ: -5, maxZ: 5 })
  markSegment(grid, { x: -5, z: 0 }, { x: 5, z: 0 }, 1.3, 'road'); markCircle(grid, { x: 0, z: 0 }, 0.8, 'marker')
  const mask = walkMask(grid, 'person')
  const path = findPath(mask, { x: -4, z: 0 }, { x: 4, z: 0 })!
  for (let index = 1; index < path.length; index += 1) expect(segmentClear(mask, path[index - 1], path[index])).toBe(true)
})
```

- [ ] **Step 2: Run** `npx vitest run src/render/world/navigation/findPath.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement `findPath.ts`** (binary-heap open list keyed by cell index, `Float32Array` g-scores).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(render): A* and line of sight on walk masks`
