# Phase 2 — Procedural timber fences

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `plan_index.md` first (Global Constraints).

**Spec:** section 5.

### Task 2.1: Fence pieces and instanced fence renderer

**Files:**
- Create: `src/render/world/fencePieces.ts`, `src/render/world/fencePieces.test.ts`, `src/render/world/Fences.tsx`
- Modify: `src/render/models/manifest.ts`, `src/render/models/manifest.test.ts`, `src/render/world/WorldProps.tsx`, `src/render/palette.ts`

**Interfaces:**
- Consumes: `PropItem` (`{ model, x, z, rotation, scale }`) produced by `WorldDraft.fenceLine` / `force('fence', …)`; a fence segment has its centre at `(x, z)`, its length is `scale` and its direction is `(cos rotation, -sin rotation)`.
- Produces: `PROCEDURAL_MODEL_IDS = ['fence', 'fence-gate']`, `type ProceduralModelId`, `isProceduralModel(id: ModelId): boolean` in `manifest.ts`; `fencePieces(props: PropItem[]): FencePiece[]`; `<Fences props shadows />`.

- [ ] **Step 1: Write the failing tests**

`src/render/world/fencePieces.test.ts`:
```ts
import { FENCE, fencePieces } from '@/render/world/fencePieces'
import type { PropItem } from '@/render/world/worldTypes'

function segment(x: number, z: number, rotation = 0, model: PropItem['model'] = 'fence', scale = 1): PropItem {
  return { model, x, z, rotation, scale }
}

describe('fencePieces', () => {
  it('puts one post at each end of a segment and two rails between them', () => {
    const pieces = fencePieces([segment(0, 0)])
    const posts = pieces.filter((piece) => piece.kind === 'post')
    expect(posts.map((post) => post.x).sort((a, b) => a - b)).toEqual([-0.5, 0.5])
    const rails = pieces.filter((piece) => piece.kind === 'rail')
    expect(rails.map((rail) => rail.y)).toEqual(FENCE.railHeights)
    for (const rail of rails) expect(rail.length).toBe(1)
  })

  it('shares posts between neighbouring segments of a line', () => {
    const line = [0, 1, 2, 3].map((index) => segment(index + 0.5, 0))
    const pieces = fencePieces(line)
    expect(pieces.filter((piece) => piece.kind === 'post')).toHaveLength(5)
    expect(pieces.filter((piece) => piece.kind === 'rail')).toHaveLength(8)
  })

  it('closes a square with four shared corner posts', () => {
    const square = [segment(0, -0.5), segment(0, 0.5), segment(-0.5, 0, Math.PI / 2), segment(0.5, 0, Math.PI / 2)]
    expect(fencePieces(square).filter((piece) => piece.kind === 'post')).toHaveLength(4)
  })

  it('builds a gate with taller posts and crossed braces', () => {
    const pieces = fencePieces([segment(0, 0, 0, 'fence-gate')])
    expect(pieces.filter((piece) => piece.kind === 'gatePost')).toHaveLength(2)
    const braces = pieces.filter((piece) => piece.kind === 'brace')
    expect(braces).toHaveLength(2)
    expect(braces[0].tilt).toBeCloseTo(-braces[1].tilt)
    expect(braces[0].tilt).not.toBe(0)
  })

  it('keeps the rail direction of the segment and shrinks short map fences', () => {
    const [rail] = fencePieces([segment(0, 0, Math.PI / 2, 'fence', 0.5)]).filter((piece) => piece.kind === 'rail')
    expect(rail.rotation).toBeCloseTo(Math.PI / 2)
    expect(rail.length).toBeCloseTo(0.5)
    expect(rail.size).toBeCloseTo(0.5)
  })

  it('ignores props that are not fences', () => {
    expect(fencePieces([{ model: 'cow', x: 0, z: 0, rotation: 0, scale: 1 }])).toEqual([])
  })
})
```

In `src/render/models/manifest.test.ts`, add inside the `describe`:
```ts
  it('draws fences procedurally instead of loading a model', () => {
    expect(PROCEDURAL_MODEL_IDS).toEqual(['fence', 'fence-gate'])
    expect(isProceduralModel('fence')).toBe(true)
    expect(isProceduralModel('cow')).toBe(false)
    expect([...REQUIRED_MODEL_IDS, ...WORLD_MODEL_IDS]).not.toContain('fence')
  })
```
and extend its import to `import { isProceduralModel, MODEL_BUDGET_BYTES, parseManifest, PROCEDURAL_MODEL_IDS, REQUIRED_MODEL_IDS, WORLD_MODEL_IDS } from '@/render/models/manifest'`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/render/world/fencePieces.test.ts src/render/models/manifest.test.ts`
Expected: FAIL — module `fencePieces` not found; `PROCEDURAL_MODEL_IDS` not exported.

- [ ] **Step 3: Procedural model ids**

`src/render/models/manifest.ts`:
- Delete `'fence'` from `REQUIRED_MODEL_IDS` and `'fence-gate'` from `WORLD_MODEL_IDS`.
- Add after `WORLD_MODEL_IDS`:
```ts
export const PROCEDURAL_MODEL_IDS = ['fence', 'fence-gate'] as const

export type ProceduralModelId = (typeof PROCEDURAL_MODEL_IDS)[number]
```
- Change the `ModelId` type to:
```ts
export type ModelId =
  | (typeof REQUIRED_MODEL_IDS)[number]
  | (typeof OPTIONAL_MODEL_IDS)[number]
  | (typeof WORLD_MODEL_IDS)[number]
  | ProceduralModelId
```
- Add:
```ts
const PROCEDURAL_SET: ReadonlySet<string> = new Set(PROCEDURAL_MODEL_IDS)

export function isProceduralModel(id: ModelId): boolean {
  return PROCEDURAL_SET.has(id)
}
```

- [ ] **Step 4: Fence pieces**

`src/render/world/fencePieces.ts`:
```ts
import type { PropItem } from '@/render/world/worldTypes'

export type FencePieceKind = 'post' | 'gatePost' | 'rail' | 'brace'

export interface FencePiece {
  kind: FencePieceKind
  x: number
  y: number
  z: number
  rotation: number
  length: number
  tilt: number
  size: number
}

export const FENCE = {
  postHeight: 0.55,
  gatePostHeight: 0.7,
  postSize: 0.1,
  railHeights: [0.2, 0.42],
  railThickness: 0.06,
  railDepth: 0.08,
  braceRise: 0.22,
} as const

function postKey(x: number, z: number): string {
  return `${Math.round(x * 100)}:${Math.round(z * 100)}`
}

export function fencePieces(props: PropItem[]): FencePiece[] {
  const posts = new Map<string, FencePiece>()
  const spans: FencePiece[] = []
  for (const prop of props) {
    if (prop.model !== 'fence' && prop.model !== 'fence-gate') continue
    const gate = prop.model === 'fence-gate'
    const length = prop.scale
    const size = Math.min(1, prop.scale)
    const dx = Math.cos(prop.rotation) * (length / 2)
    const dz = -Math.sin(prop.rotation) * (length / 2)
    for (const [x, z] of [
      [prop.x - dx, prop.z - dz],
      [prop.x + dx, prop.z + dz],
    ]) {
      const key = postKey(x, z)
      const existing = posts.get(key)
      if (existing && (existing.kind === 'gatePost' || !gate)) continue
      posts.set(key, { kind: gate ? 'gatePost' : 'post', x, y: 0, z, rotation: prop.rotation, length: 0, tilt: 0, size })
    }
    for (const height of FENCE.railHeights) {
      spans.push({ kind: 'rail', x: prop.x, y: height * size, z: prop.z, rotation: prop.rotation, length, tilt: 0, size })
    }
    if (gate) {
      const tilt = Math.atan2(FENCE.braceRise * size, length)
      const braceLength = Math.hypot(length, FENCE.braceRise * size)
      const middle = ((FENCE.railHeights[0] + FENCE.railHeights[1]) / 2) * size
      spans.push({ kind: 'brace', x: prop.x, y: middle, z: prop.z, rotation: prop.rotation, length: braceLength, tilt, size })
      spans.push({ kind: 'brace', x: prop.x, y: middle, z: prop.z, rotation: prop.rotation, length: braceLength, tilt: -tilt, size })
    }
  }
  return [...posts.values(), ...spans]
}
```

- [ ] **Step 5: Run the pure tests**

Run: `npx vitest run src/render/world/fencePieces.test.ts src/render/models/manifest.test.ts`
Expected: PASS.

- [ ] **Step 6: Renderer and routing**

`src/render/palette.ts`: add after `fence`:
```ts
  fenceWood: '#8a5a33',
  fenceWoodDark: '#6b4325',
```

`src/render/world/Fences.tsx`:
```tsx
import { useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, ConeGeometry, Euler, Matrix4, MeshStandardMaterial, Quaternion, Vector3, type InstancedMesh } from 'three'
import { FENCE, fencePieces, type FencePiece } from '@/render/world/fencePieces'
import { PALETTE } from '@/render/palette'
import type { PropItem } from '@/render/world/worldTypes'

const BOX = new BoxGeometry(1, 1, 1)
const CAP = new ConeGeometry(0.75, 0.6, 4)
const WOOD = new MeshStandardMaterial({ color: PALETTE.fenceWood, flatShading: true, roughness: 0.85, metalness: 0.02 })
const POST_WOOD = new MeshStandardMaterial({ color: PALETTE.fenceWoodDark, flatShading: true, roughness: 0.85, metalness: 0.02 })

function postHeight(piece: FencePiece): number {
  return (piece.kind === 'gatePost' ? FENCE.gatePostHeight : FENCE.postHeight) * piece.size
}

function postMatrix(piece: FencePiece): Matrix4 {
  const height = postHeight(piece)
  const width = FENCE.postSize * piece.size
  return new Matrix4().compose(
    new Vector3(piece.x, height / 2, piece.z),
    new Quaternion().setFromEuler(new Euler(0, piece.rotation, 0)),
    new Vector3(width, height, width),
  )
}

function capMatrix(piece: FencePiece): Matrix4 {
  const width = FENCE.postSize * piece.size
  return new Matrix4().compose(
    new Vector3(piece.x, postHeight(piece) + width * 0.3, piece.z),
    new Quaternion().setFromEuler(new Euler(0, piece.rotation + Math.PI / 4, 0)),
    new Vector3(width, width, width),
  )
}

function spanMatrix(piece: FencePiece): Matrix4 {
  return new Matrix4().compose(
    new Vector3(piece.x, piece.y, piece.z),
    new Quaternion().setFromEuler(new Euler(0, piece.rotation, piece.tilt, 'YZX')),
    new Vector3(piece.length, FENCE.railThickness * piece.size, FENCE.railDepth * piece.size),
  )
}

function PieceMesh({ pieces, geometry, material, matrix, shadows }: { pieces: FencePiece[]; geometry: BoxGeometry | ConeGeometry; material: MeshStandardMaterial; matrix: (piece: FencePiece) => Matrix4; shadows: boolean }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    pieces.forEach((piece, index) => mesh.setMatrixAt(index, matrix(piece)))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [pieces, matrix])
  if (pieces.length === 0) return null
  return <instancedMesh key={pieces.length} ref={ref} args={[geometry, material, pieces.length]} castShadow={shadows} receiveShadow />
}

export function Fences({ props, shadows }: { props: PropItem[]; shadows: boolean }) {
  const pieces = useMemo(() => fencePieces(props), [props])
  const posts = useMemo(() => pieces.filter((piece) => piece.kind === 'post' || piece.kind === 'gatePost'), [pieces])
  const spans = useMemo(() => pieces.filter((piece) => piece.kind === 'rail' || piece.kind === 'brace'), [pieces])
  return (
    <group>
      <PieceMesh pieces={posts} geometry={BOX} material={POST_WOOD} matrix={postMatrix} shadows={shadows} />
      <PieceMesh pieces={posts} geometry={CAP} material={POST_WOOD} matrix={capMatrix} shadows={false} />
      <PieceMesh pieces={spans} geometry={BOX} material={WOOD} matrix={spanMatrix} shadows={shadows} />
    </group>
  )
}
```

`src/render/world/WorldProps.tsx`:
- Add imports `import { isProceduralModel } from '@/render/models/manifest'` (merge into the existing type import line as `import { isProceduralModel, type ModelId } from '@/render/models/manifest'`) and `import { Fences } from '@/render/world/Fences'`.
- Change the groups line to exclude procedural models and add the fences list:
```tsx
  const groups = useMemo(() => groupProps(world.props.filter((prop) => !INDIVIDUAL.has(prop.model) && !isProceduralModel(prop.model))), [world])
  const fences = useMemo(() => world.props.filter((prop) => isProceduralModel(prop.model)), [world])
```
- Render `<Fences props={fences} shadows={shadows} />` right after the instanced groups.

- [ ] **Step 7: Typecheck, full unit suite**

Run: `npm run typecheck && npx vitest run --maxWorkers=2`
Expected: PASS. (`generatedModels.test.ts` still finds every id because `fence` is no longer in the required lists; the old fence GLB entries stay in the generated manifest until Task 7.1.)

- [ ] **Step 8: Quick look**

With the dev server (`npx vite --port 5179 --strictPort`) open `http://localhost:5179/#/jogar/m4-auto-harvest` and the mission map `#/missoes`: fences must show thick dark posts with two rails, continuous around the grid and the pasture, smaller on the map. Close the browser afterwards.

- [ ] **Step 9: Commit**

```bash
git add -A src
git commit -m "feat(world): procedural timber fences with shared posts and gate braces

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
