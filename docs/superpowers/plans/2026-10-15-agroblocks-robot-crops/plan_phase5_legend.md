# Phase 5 — Paged legend dialog

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Read `plan_index.md` first (Global Constraints).

**Spec:** section 7.

### Task 5.1: Legend pages data

**Files:**
- Create: `src/features/legend/legendPages.ts`, `src/features/legend/legendPages.test.ts`

**Interfaces:**
- Produces:
  - `type LegendPageId = 'empty' | 'prepared' | 'wet' | 'planted' | 'growing' | 'ready' | 'obstacle' | 'reservoir' | 'depot' | 'goal'`
  - `interface LegendPreview { terrain: Terrain; plot: PlotState; moisture: Moisture; goal: boolean }`
  - `interface LegendPage { id; group: 'Solo' | 'Fazenda'; title; description; reachedBy: string | null; next: string | null; sensor: string | null; preview: LegendPreview }`
  - `LEGEND_PAGES: LegendPage[]`, `legendCell(preview: LegendPreview): Cell`

- [ ] **Step 1: Write the failing test**

`src/features/legend/legendPages.test.ts`:
```ts
import { LEGEND_PAGES, legendCell } from '@/features/legend/legendPages'

describe('LEGEND_PAGES', () => {
  it('lists the soil states first and the farm elements after', () => {
    expect(LEGEND_PAGES.map((page) => page.id)).toEqual(['empty', 'prepared', 'wet', 'planted', 'growing', 'ready', 'obstacle', 'reservoir', 'depot', 'goal'])
    expect(LEGEND_PAGES.filter((page) => page.group === 'Solo')).toHaveLength(6)
    expect(new Set(LEGEND_PAGES.map((page) => page.id)).size).toBe(LEGEND_PAGES.length)
  })

  it('uses the names the student sees in the game', () => {
    expect(LEGEND_PAGES.slice(0, 6).map((page) => page.title)).toEqual(['Vazio', 'Preparado', 'Molhado', 'Plantado', 'Crescendo', 'Pronto para colher'])
  })

  it('tells how to reach every soil state and what to do next', () => {
    const soil = LEGEND_PAGES.filter((page) => page.group === 'Solo')
    for (const page of soil) {
      expect(page.next).toBeTruthy()
      if (page.id === 'empty') expect(page.reachedBy).toBeNull()
      else expect(page.reachedBy).toBeTruthy()
    }
    expect(LEGEND_PAGES.find((page) => page.id === 'ready')?.next).toBe('colher planta')
    expect(LEGEND_PAGES.find((page) => page.id === 'prepared')?.reachedBy).toBe('preparar solo')
  })

  it('previews each page with the matching cell', () => {
    const preview = (id: string) => LEGEND_PAGES.find((page) => page.id === id)?.preview
    expect(preview('ready')).toMatchObject({ terrain: 'soil', plot: 'mature' })
    expect(preview('wet')).toMatchObject({ terrain: 'soil', plot: 'tilled', moisture: 'wet' })
    expect(preview('planted')).toMatchObject({ plot: 'seeded' })
    expect(preview('obstacle')).toMatchObject({ terrain: 'obstacle' })
    expect(preview('goal')).toMatchObject({ terrain: 'soil', goal: true })
  })

  it('builds a game cell from a preview', () => {
    expect(legendCell({ terrain: 'soil', plot: 'growing', moisture: 'dry', goal: false })).toEqual({ terrain: 'soil', plot: 'growing', moisture: 'dry', growth: 0 })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/legend`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/features/legend/legendPages.ts`:
```ts
import type { Cell, Moisture, PlotState, Terrain } from '@/game/world/types'

export type LegendPageId = 'empty' | 'prepared' | 'wet' | 'planted' | 'growing' | 'ready' | 'obstacle' | 'reservoir' | 'depot' | 'goal'

export interface LegendPreview {
  terrain: Terrain
  plot: PlotState
  moisture: Moisture
  goal: boolean
}

export interface LegendPage {
  id: LegendPageId
  group: 'Solo' | 'Fazenda'
  title: string
  description: string
  reachedBy: string | null
  next: string | null
  sensor: string | null
  preview: LegendPreview
}

function soil(plot: PlotState, moisture: Moisture = 'dry', goal = false): LegendPreview {
  return { terrain: 'soil', plot, moisture, goal }
}

function element(terrain: Terrain): LegendPreview {
  return { terrain, plot: 'untilled', moisture: 'dry', goal: false }
}

export const LEGEND_PAGES: LegendPage[] = [
  {
    id: 'empty',
    group: 'Solo',
    title: 'Vazio',
    description: 'Terra lisa, sem moldura de madeira. Ainda não dá para plantar aqui: primeiro o solo precisa ser preparado.',
    reachedBy: null,
    next: 'preparar solo',
    sensor: 'o canteiro está vazio? → sim',
    preview: soil('untilled'),
  },
  {
    id: 'prepared',
    group: 'Solo',
    title: 'Preparado',
    description: 'Solo revolvido, com sulcos e moldura de madeira. Está pronto para receber uma semente.',
    reachedBy: 'preparar solo',
    next: 'plantar semente',
    sensor: 'o canteiro está vazio? → sim',
    preview: soil('tilled'),
  },
  {
    id: 'wet',
    group: 'Solo',
    title: 'Molhado',
    description: 'Terra escura com uma gota azul em cima. Plantas só crescem em solo molhado; quando a planta cresce, o solo volta a secar.',
    reachedBy: 'regar canteiro',
    next: 'aguardar: a planta cresce enquanto o robô continua trabalhando',
    sensor: 'o solo está seco? → não',
    preview: soil('tilled', 'wet'),
  },
  {
    id: 'planted',
    group: 'Solo',
    title: 'Plantado',
    description: 'Um broto de duas folhas sobre um montinho de terra. A semente só cresce se o solo estiver molhado.',
    reachedBy: 'plantar semente',
    next: 'regar canteiro',
    sensor: 'o canteiro está vazio? → não',
    preview: soil('seeded'),
  },
  {
    id: 'growing',
    group: 'Solo',
    title: 'Crescendo',
    description: 'Uma moita verde, ainda sem tomates. Ela não pode ser colhida: regue de novo para que amadureça.',
    reachedBy: 'regar canteiro com semente (ela cresce com o tempo)',
    next: 'regar canteiro',
    sensor: 'a planta está madura? → não',
    preview: soil('growing'),
  },
  {
    id: 'ready',
    group: 'Solo',
    title: 'Pronto para colher',
    description: 'Moita cheia de tomates vermelhos, com um anel dourado no chão e um brilho por cima.',
    reachedBy: 'regar canteiro crescendo (a planta amadurece com o tempo)',
    next: 'colher planta',
    sensor: 'a planta está madura? → sim',
    preview: soil('mature'),
  },
  {
    id: 'obstacle',
    group: 'Fazenda',
    title: 'Pedra',
    description: 'Bloqueia a passagem: o robô não pode entrar nesta casa.',
    reachedBy: null,
    next: 'desviar usando virar à esquerda ou virar à direita',
    sensor: 'existe obstáculo à frente? → sim',
    preview: element('obstacle'),
  },
  {
    id: 'reservoir',
    group: 'Fazenda',
    title: 'Reservatório de água',
    description: 'Caixa d’água onde o robô enche o tanque para poder regar.',
    reachedBy: null,
    next: 'coletar recursos com o robô sobre o reservatório',
    sensor: null,
    preview: element('reservoir'),
  },
  {
    id: 'depot',
    group: 'Fazenda',
    title: 'Depósito de sementes',
    description: 'Caixa com sacos de sementes para repor o estoque do robô.',
    reachedBy: null,
    next: 'coletar recursos com o robô sobre o depósito',
    sensor: 'há sementes disponíveis?',
    preview: element('seedDepot'),
  },
  {
    id: 'goal',
    group: 'Fazenda',
    title: 'Canteiro do objetivo',
    description: 'A moldura amarela marca os canteiros que a missão pede.',
    reachedBy: null,
    next: 'levar o robô até eles e fazer o que o objetivo pede',
    sensor: null,
    preview: soil('untilled', 'dry', true),
  },
]

export function legendCell(preview: LegendPreview): Cell {
  return { terrain: preview.terrain, plot: preview.plot, moisture: preview.moisture, growth: 0 }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/legend`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/legend
git commit -m "feat(legend): legend pages for every soil state and farm element

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5.2: Legend dialog with a single 3D preview

**Files:**
- Create: `src/features/legend/LegendDialog.tsx`, `src/features/legend/LegendDialog.css`, `src/features/legend/LegendDialog.test.tsx`, `src/features/legend/LegendPreview3D.tsx`, `src/features/legend/LegendTile2D.tsx`
- Modify: `src/render/grid2d/Grid2D.tsx`, `src/render/FarmView.tsx`, `src/render/FarmView.css`, `tests/e2e/motion.spec.ts`

**Interfaces:**
- Consumes: Task 5.1 exports; `PlotTile` from Task 1.1 (props `cell, position, isGoal, reducedMotion`); `GameDialog`, `DialogSection`, `PillTabs`, `tabId`, `panelId`, `GameButton`.
- Produces: `<LegendDialog open onClose use3d reducedMotion />`; `PLOT_GLYPHS` and `TERRAIN_GLYPHS` exported from `Grid2D.tsx`.

- [ ] **Step 1: Write the failing test**

`src/features/legend/LegendDialog.test.tsx`:
```tsx
import { useState } from 'react'
import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { LegendDialog } from '@/features/legend/LegendDialog'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Legenda
      </button>
      <LegendDialog open={open} onClose={() => setOpen(false)} use3d={false} reducedMotion />
    </>
  )
}

function openLegend() {
  render(<Harness />)
  const opener = screen.getByRole('button', { name: 'Legenda' })
  opener.focus()
  fireEvent.click(opener)
  return screen.getByRole('dialog', { name: 'Legenda' })
}

describe('LegendDialog', () => {
  it('opens on the empty soil page with one preview', () => {
    openLegend()
    expect(screen.getByRole('heading', { name: 'Vazio' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Vazio' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('1/10')).toBeInTheDocument()
    expect(document.querySelectorAll('.legend__preview')).toHaveLength(1)
  })

  it('navigates by side list, arrows and keyboard', () => {
    const dialog = openLegend()
    fireEvent.click(screen.getByRole('tab', { name: 'Pronto para colher' }))
    expect(screen.getByRole('heading', { name: 'Pronto para colher' })).toBeInTheDocument()
    expect(screen.getByText('colher planta')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getByRole('heading', { name: 'Pedra' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(screen.getByRole('heading', { name: 'Crescendo' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Vazio' }))
    fireEvent.keyDown(dialog.querySelector('.legend__layout') as Element, { key: 'ArrowLeft' })
    expect(screen.getByRole('heading', { name: 'Canteiro do objetivo' })).toBeInTheDocument()
    fireEvent.keyDown(dialog.querySelector('.legend__layout') as Element, { key: 'ArrowRight' })
    expect(screen.getByRole('heading', { name: 'Vazio' })).toBeInTheDocument()
    expect(document.querySelectorAll('.legend__preview')).toHaveLength(1)
  })

  it('closes, returns focus to the legend button and reopens on the first page', async () => {
    openLegend()
    fireEvent.click(screen.getByRole('tab', { name: 'Molhado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'))
    expect(screen.getByRole('button', { name: 'Legenda' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Legenda' }))
    expect(screen.getByRole('heading', { name: 'Vazio' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/legend/LegendDialog.test.tsx`
Expected: FAIL — module `LegendDialog` not found.

- [ ] **Step 3: Export the 2D glyphs**

In `src/render/grid2d/Grid2D.tsx`, prefix `const PLOT_GLYPHS` and `const TERRAIN_GLYPHS` with `export`.

- [ ] **Step 4: 2D tile and 3D preview**

`src/features/legend/LegendTile2D.tsx`:
```tsx
import type { LegendPreview } from '@/features/legend/legendPages'
import { PLOT_GLYPHS, TERRAIN_GLYPHS } from '@/render/grid2d/Grid2D'

export function LegendTile2D({ preview }: { preview: LegendPreview }) {
  const isSoil = preview.terrain === 'soil'
  const glyph = preview.terrain === 'soil' ? PLOT_GLYPHS[preview.plot] : TERRAIN_GLYPHS[preview.terrain]
  const classes = [
    'grid2d__cell',
    'legend__tile',
    `grid2d__cell--${preview.terrain}`,
    isSoil ? `grid2d__cell--${preview.plot}` : '',
    preview.moisture === 'wet' ? 'grid2d__cell--wet' : '',
    preview.goal ? 'grid2d__cell--goal' : '',
  ]
  return (
    <div className={classes.join(' ')} aria-hidden="true">
      <span className="grid2d__glyph">{glyph}</span>
      {isSoil && preview.moisture === 'wet' && <span className="grid2d__drop">💧</span>}
    </div>
  )
}
```

`src/features/legend/LegendPreview3D.tsx`:
```tsx
import { Suspense, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { legendCell, type LegendPreview } from '@/features/legend/legendPages'
import { Flat } from '@/render/farm3d/materials'
import { PlotTile } from '@/render/farm3d/PlotTile'
import { PALETTE } from '@/render/palette'

function Turntable({ active, children }: { active: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null)
  useFrame((_, delta) => {
    if (active && ref.current) ref.current.rotation.y += delta * 0.5
  })
  return (
    <group ref={ref} rotation={[0, -0.4, 0]}>
      {children}
    </group>
  )
}

export default function LegendPreview3D({ preview, reducedMotion }: { preview: LegendPreview; reducedMotion: boolean }) {
  const key = `${preview.terrain}-${preview.plot}-${preview.moisture}-${preview.goal}`
  return (
    <Canvas orthographic dpr={[1, 2]} camera={{ position: [4, 3.6, 4], zoom: 105, near: -50, far: 50 }} aria-hidden="true">
      <color attach="background" args={[PALETTE.sky]} />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 1]} />
      <directionalLight position={[3, 6, 2]} intensity={1.4} />
      <Turntable active={!reducedMotion}>
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[1.5, 0.1, 1.5]} />
          <Flat color={PALETTE.grassMid} />
        </mesh>
        <Suspense fallback={null}>
          <PlotTile key={key} cell={legendCell(preview)} position={[0, 0, 0]} isGoal={preview.goal} reducedMotion={reducedMotion} />
        </Suspense>
      </Turntable>
    </Canvas>
  )
}
```

- [ ] **Step 5: Dialog**

`src/features/legend/LegendDialog.tsx`:
```tsx
import { lazy, Suspense, useState, type KeyboardEvent } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { panelId, PillTabs, tabId, type TabItem } from '@/components/game/PillTabs'
import { LEGEND_PAGES, type LegendPageId } from '@/features/legend/legendPages'
import { LegendTile2D } from '@/features/legend/LegendTile2D'
import './LegendDialog.css'

const LegendPreview3D = lazy(() => import('@/features/legend/LegendPreview3D'))

const PREFIX = 'legend'
const TABS: TabItem[] = LEGEND_PAGES.map((page) => ({ id: page.id, label: page.title }))

function LegendBody({ use3d, reducedMotion }: { use3d: boolean; reducedMotion: boolean }) {
  const [pageId, setPageId] = useState<LegendPageId>('empty')
  const index = LEGEND_PAGES.findIndex((page) => page.id === pageId)
  const page = LEGEND_PAGES[index]
  const go = (delta: number) => setPageId(LEGEND_PAGES[(index + delta + LEGEND_PAGES.length) % LEGEND_PAGES.length].id)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    go(event.key === 'ArrowLeft' ? -1 : 1)
  }
  const tile = <LegendTile2D preview={page.preview} />

  return (
    <DialogSection>
      <div className="legend__layout" onKeyDown={onKeyDown}>
        <PillTabs items={TABS} active={pageId} onChange={(id) => setPageId(id as LegendPageId)} label="Páginas da legenda" idPrefix={PREFIX} orientation="vertical" />
        <div role="tabpanel" id={panelId(PREFIX, pageId)} aria-labelledby={tabId(PREFIX, pageId)} className="legend__panel">
          <div className="legend__preview">
            {use3d ? (
              <Suspense fallback={tile}>
                <LegendPreview3D preview={page.preview} reducedMotion={reducedMotion} />
              </Suspense>
            ) : (
              tile
            )}
          </div>
          <p className="legend__group">{page.group}</p>
          <h3 className="legend__title">{page.title}</h3>
          <p className="legend__description">{page.description}</p>
          <dl className="legend__facts">
            {page.reachedBy && (
              <>
                <dt>Chega aqui com</dt>
                <dd>{page.reachedBy}</dd>
              </>
            )}
            {page.next && (
              <>
                <dt>Próximo passo</dt>
                <dd>{page.next}</dd>
              </>
            )}
            {page.sensor && (
              <>
                <dt>Sensor</dt>
                <dd>{page.sensor}</dd>
              </>
            )}
          </dl>
          <div className="legend__pager">
            <GameButton tone="secondary" icon="back" aria-label="Página anterior" onClick={() => go(-1)} />
            <span aria-live="polite">
              {index + 1}/{LEGEND_PAGES.length}
            </span>
            <GameButton tone="secondary" icon="forward" aria-label="Próxima página" onClick={() => go(1)} />
          </div>
        </div>
      </div>
    </DialogSection>
  )
}

interface LegendDialogProps {
  open: boolean
  onClose: () => void
  use3d: boolean
  reducedMotion: boolean
}

export function LegendDialog({ open, onClose, use3d, reducedMotion }: LegendDialogProps) {
  return (
    <GameDialog open={open} title="Legenda" icon="book" tone="info" size="lg" onClose={onClose}>
      <LegendBody use3d={use3d} reducedMotion={reducedMotion} />
    </GameDialog>
  )
}
```
(The page state lives in `LegendBody`, inside the dialog frame that unmounts when closed, so every opening starts on "Vazio".)

`src/features/legend/LegendDialog.css`:
```css
.legend__layout {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: var(--space-5);
  min-height: 380px;
}

.legend__panel {
  display: grid;
  align-content: start;
  gap: var(--space-3);
}

.legend__preview {
  display: grid;
  place-items: center;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--color-surface-alt);
}

.legend__tile {
  width: 120px;
  height: 120px;
  font-size: 3rem;
}

.legend__group {
  margin: 0;
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.legend__title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 800;
}

.legend__description {
  margin: 0;
  color: var(--color-text-muted);
}

.legend__facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-1) var(--space-3);
  margin: 0;
  font-size: var(--text-sm);
}

.legend__facts dt {
  font-weight: 700;
}

.legend__facts dd {
  margin: 0;
}

.legend__pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  font-weight: 700;
}

@media (max-width: 720px) {
  .legend__layout {
    grid-template-columns: 1fr;
  }

  .legend__layout .pill-tabs--vertical {
    flex-direction: row;
    overflow-x: auto;
  }
}
```

- [ ] **Step 6: Run the dialog test**

Run: `npx vitest run src/features/legend`
Expected: PASS.

- [ ] **Step 7: Wire into the farm view**

In `src/render/FarmView.tsx`:
- Add `import { LegendDialog } from '@/features/legend/LegendDialog'`.
- Change the legend button to:
```tsx
        <button type="button" className="farm-view__tool farm-view__tool--wide" aria-haspopup="dialog" onClick={() => setShowLegend(true)}>
          Legenda
        </button>
```
- Replace the whole `{showLegend && (<ul className="farm-view__legend"> … </ul>)}` block with:
```tsx
      <LegendDialog open={showLegend} onClose={() => setShowLegend(false)} use3d={use3d} reducedMotion={reducedMotion} />
```

In `src/render/FarmView.css`, delete the rules `.farm-view__legend`, `.farm-view__legend li` and every `.legend-swatch…` rule.

Run: `grep -rn "farm-view__legend\|legend-swatch" src`
Expected: no lines.

- [ ] **Step 8: E2E**

Append to `tests/e2e/motion.spec.ts`:
```ts
test('the legend opens as a paged dialog with one 3D preview and closes', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await seedStorage(page, { settings: { renderMode: '3d', motion: 'full' } })
  await openMission(page, 'm1-first-harvest')
  await page.getByRole('button', { name: 'Legenda' }).click()
  const dialog = page.getByRole('dialog', { name: 'Legenda' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Vazio' })).toBeVisible()
  await dialog.getByRole('tab', { name: 'Pronto para colher' }).click()
  await expect(dialog.getByRole('heading', { name: 'Pronto para colher' })).toBeVisible()
  await expect(dialog.locator('canvas')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(errors).toEqual([])
})
```

- [ ] **Step 9: Run everything**

Run: `npm run typecheck && npx vitest run --maxWorkers=2 && npx playwright test`
Expected: PASS (15 E2E).

- [ ] **Step 10: Commit**

```bash
git add -A src tests
git commit -m "feat(legend): paged legend dialog with a rotating 3D plot preview

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
