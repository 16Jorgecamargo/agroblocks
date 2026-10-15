# Phase 4 — Resource chips only when the mission uses them

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `plan_index.md` first (Global Constraints).

**Spec:** section 8.

### Task 4.1: `visibleResources` and conditional chips

**Files:**
- Modify: `src/features/gameplay/hudLogic.ts`, `src/features/gameplay/components/GameHud.tsx`, `src/features/gameplay/components/hud.test.tsx`
- Create: `src/features/gameplay/hudLogic.visible.test.ts`

**Interfaces:**
- Consumes: `programBlockTypes(program: Program): Set<BlockType>` from `@/blocks/analysis/programBlockTypes`; `MissionDefinition.referenceSolution`, `MissionDefinition.resources`.
- Produces: `type HudResource = 'seeds' | 'water' | 'energy' | 'harvest'`; `visibleResources(mission: MissionDefinition): HudResource[]` (always in the order seeds, water, energy, harvest).

- [ ] **Step 1: Write the failing tests**

`src/features/gameplay/hudLogic.visible.test.ts`:
```ts
import { MISSIONS } from '@/data/missions'
import { visibleResources } from '@/features/gameplay/hudLogic'

describe('visibleResources', () => {
  it('shows only the resources each mission really uses', () => {
    const table = Object.fromEntries(MISSIONS.map((mission) => [mission.id, visibleResources(mission)]))
    expect(table).toEqual({
      'm0-training': ['harvest'],
      'm1-first-harvest': ['harvest'],
      'm2-row-planting': ['seeds'],
      'm3-smart-irrigation': ['water'],
      'm4-auto-harvest': ['harvest'],
      'm5-limited-resources': ['seeds', 'water'],
      'm6-efficient-farm': ['seeds', 'water', 'energy'],
    })
  })
})
```

In `src/features/gameplay/components/hud.test.tsx`, replace the test `'marks low and empty resources'` with:
```tsx
  it('marks low and empty resources', () => {
    const efficient = getMission('m6-efficient-farm')
    if (!efficient) throw new Error('missing')
    render(<GameHud mission={efficient} resources={{ seeds: 1, water: 0, energy: 70, harvested: 0 }} onHelp={vi.fn()} onSettings={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByLabelText('Sementes: 1')).toHaveAttribute('data-level', 'low')
    expect(screen.getByLabelText('Água: 0')).toHaveAttribute('data-level', 'empty')
    expect(screen.getByLabelText('Energia: 70')).toHaveAttribute('data-level', 'ok')
    expect(screen.queryByLabelText(/^Colheita/)).not.toBeInTheDocument()
  })

  it('shows only the harvest chip in a harvest-only mission', () => {
    const harvest = getMission('m4-auto-harvest')
    if (!harvest) throw new Error('missing')
    render(<GameHud mission={harvest} resources={{ seeds: null, water: null, energy: null, harvested: 2 }} onHelp={vi.fn()} onSettings={vi.fn()} onExit={vi.fn()} />)
    expect(screen.getByLabelText('Colheita: 2')).toHaveAttribute('data-flight-target', 'harvest')
    expect(screen.queryByLabelText(/^Sementes/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Água/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Energia/)).not.toBeInTheDocument()
  })
```
Delete the now-unused top-level `mission` constant (`getMission('m5-limited-resources')`) and its guard if no other test in the file uses it.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/gameplay/hudLogic.visible.test.ts src/features/gameplay/components/hud.test.tsx`
Expected: FAIL — `visibleResources` is not exported; the Colheita chip is rendered for m6.

If the mission table assertion fails on a row after Step 3 (a reference solution differs from what the spec expected), stop and compare with `programBlockTypes(mission.referenceSolution)`; the rule in Step 3 is the authority, update the expected row and ledger a ruling.

- [ ] **Step 3: Implement the rule**

Append to `src/features/gameplay/hudLogic.ts`:
```ts
export type HudResource = 'seeds' | 'water' | 'energy' | 'harvest'

export function visibleResources(mission: MissionDefinition): HudResource[] {
  const blocks = programBlockTypes(mission.referenceSolution)
  const { resources } = mission
  const visible: HudResource[] = []
  if (blocks.has('farm_plant') || resources.seeds !== null) visible.push('seeds')
  if (blocks.has('farm_water') || resources.water !== null) visible.push('water')
  if (resources.energy !== null) visible.push('energy')
  if (blocks.has('farm_harvest')) visible.push('harvest')
  return visible
}
```
and add `import { programBlockTypes } from '@/blocks/analysis/programBlockTypes'` at the top.

In `src/features/gameplay/components/GameHud.tsx`:
- Change the hudLogic import to `import { resourceLevel, resourceMaxima, visibleResources } from '@/features/gameplay/hudLogic'`.
- In `GameHud`, add `const visible = useMemo(() => new Set(visibleResources(mission)), [mission])`.
- Replace the four chips with:
```tsx
        {visible.has('seeds') && <ResourceChip icon="seed" label="Sementes" value={resources.seeds} max={maxima.seeds} tone="seed" />}
        {visible.has('water') && <ResourceChip icon="drop" label="Água" value={resources.water} max={maxima.water} tone="water" />}
        {visible.has('energy') && <ResourceChip icon="bolt" label="Energia" value={resources.energy} max={maxima.energy} tone="energy" />}
        {visible.has('harvest') && (
          <ResourceChip icon="basket" label="Colheita" value={resources.harvested} max={null} tone="harvest" flightTarget popKey={arrivals} />
        )}
```

- [ ] **Step 4: Confirm the harvest flight tolerates a hidden chip**

`src/features/gameplay/GameplayPage.tsx:82-83` already does `const to = harvestTargetCenter(); if (from && to) launchFlight(from, to)`, and `harvestTargetCenter()` returns `null` when the chip is absent. Nothing to change; the Fase 2/3/6 E2E runs in Task 7.2 exercise it.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm run typecheck && npx vitest run --maxWorkers=2`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/gameplay
git commit -m "feat(hud): show resource chips only when the mission uses them

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
