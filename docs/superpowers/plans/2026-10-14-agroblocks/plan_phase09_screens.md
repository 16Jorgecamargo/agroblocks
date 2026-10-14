# AgroBlocks — Fase 9: Início, mapa de missões, resultado, como jogar e áudio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Telas que completam a navegação do jogo, fiéis à referência visual: início com fazenda 3D e botões à esquerda; "Seus desafios" com mapa 3D de nós hexagonais e cartão lateral; resultado com celebração, estatísticas reais e painel "Como funciona?"; página "Como jogar"; efeitos sonoros sintetizados e música opcional.

**Architecture:** Cada tela em `src/features/<tela>/`. Regras de tela (próxima missão, comparação de resultado, layout do mapa, sons por evento) em funções puras testadas. Cenas 3D reutilizam `FarmScene`, `RobotBody`, `Barn`, `Windmill`, `Tree`, `CameraRig` da Fase 7 e caem para ilustração CSS sem WebGL ou em modo 2D.

**Tech Stack:** React, react-router, R3F/drei (`Html`), Web Audio API.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-design.md` (seções 6 e 7) + `reference/AgroBlocks_ Fazenda Inteligente em Ação.png`

Leia `plan_index.md` antes de começar.

---

### Task 9.1: Cabeçalho de página e tela inicial

**Files:**
- Create: `src/components/layout/PageHeader.tsx`, `src/components/layout/layout.css`
- Create: `src/features/home/HomeScene.tsx`
- Modify (substituir): `src/features/home/HomePage.tsx`
- Create: `src/features/home/HomePage.css`
- Modify: `src/main.tsx` (importar `layout.css`)
- Test: `src/features/home/HomePage.test.tsx`

**Interfaces:**
- Consumes: `Logo`, `Icon`, `Modal`, `SettingsDialog`, `useProgressStore`, `continueMissionId`, `hasProgress`, `MISSIONS`, `getMission`, `useSettingsStore`, `hasWebGL`, `useReducedMotion`, `createInitialState`, `UNLIMITED_RESOURCES`.
- Produces:
  - `PageHeader({ title, subtitle?, backTo?, backLabel?, actions? })`
  - `HomeScene()` (decorativo, `aria-hidden`)
  - `HomePage` — título "Automatize. Programe. Cultive.", texto de apresentação, Iniciar nova fazenda (confirma se já houver progresso), Continuar missão (desabilitado sem progresso, mostra "Fase N - título"), Como jogar, Configurações, atalhos para Missões / Painel / Avaliação, indicador "N de 6 fases concluídas".

- [ ] **Step 1: Escrever teste que falha `src/features/home/HomePage.test.tsx`**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { HomePage } from '@/features/home/HomePage'
import { useProgressStore } from '@/stores/progressStore'

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jogar/:missionId" element={<p>jogando</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const success = (missionId: string) => ({
  missionId,
  timestamp: '2026-10-14T12:00:00.000Z',
  outcome: 'success' as const,
  errorCode: null,
  actions: 3,
  blocks: 3,
  usage: { seeds: 0, water: 0, energy: 3 },
  efficiencyStars: 3 as const,
  pseudocode: '',
})

describe('HomePage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('shows the brand and disables continue without saved progress', () => {
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: 'AgroBlocks' })).toBeInTheDocument()
    expect(screen.getByText('Automatize. Programe. Cultive.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar missão/ })).toBeDisabled()
    expect(screen.getByText('0 de 6 fases concluídas')).toBeInTheDocument()
  })

  it('starts a new farm at the training when there is no progress', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })

  it('continues at the next mission and shows its name', () => {
    useProgressStore.getState().recordAttempt(success('m0-training'))
    useProgressStore.getState().recordAttempt(success('m1-first-harvest'))
    renderHome()
    const continueButton = screen.getByRole('button', { name: /Continuar missão/ })
    expect(continueButton).toBeEnabled()
    expect(continueButton).toHaveTextContent('Fase 2 - Plantação em série')
    expect(screen.getByText('1 de 6 fases concluídas')).toBeInTheDocument()
  })

  it('asks before wiping progress when starting a new farm', () => {
    useProgressStore.getState().recordAttempt(success('m1-first-harvest'))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar nova fazenda' }))
    expect(screen.getByRole('dialog', { name: 'Começar uma nova fazenda?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Apagar e começar' }))
    expect(useProgressStore.getState().save.attempts).toHaveLength(0)
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/home`
Expected: FAIL — botões inexistentes no `HomePage` mínimo.

- [ ] **Step 3: Implementar `src/components/layout/PageHeader.tsx` e `layout.css`**

```tsx
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from '@/components/icons/Icon'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, backTo, backLabel = 'Voltar', actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      {backTo && (
        <Link to={backTo} className="page-header__back">
          <Icon name="back" /> {backLabel}
        </Link>
      )}
      <div className="page-header__titles">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  )
}
```

`src/components/layout/layout.css`:
```css
.chrome-page {
  min-height: 100vh;
  background: var(--chrome-bg);
  color: var(--chrome-text);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
}

.page-header__back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--tap-size);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  background: var(--chrome-surface);
  border: 1px solid var(--chrome-border);
  color: var(--chrome-text);
  text-decoration: none;
  font-weight: 600;
}

.page-header__titles {
  flex: 1;
}

.page-header__title {
  margin: 0;
  font-size: var(--text-xl);
}

.page-header__subtitle {
  margin: 0;
  color: var(--chrome-text-muted);
}

.page-header__actions {
  display: flex;
  gap: var(--space-2);
}

.chrome-page .card {
  color: var(--color-text);
}
```

Em `src/main.tsx`, adicionar `import '@/components/layout/layout.css'` após o import de `ui.css`.

- [ ] **Step 4: Implementar `src/features/home/HomeScene.tsx`**

```tsx
import { lazy, Suspense, useMemo } from 'react'
import { createInitialState, UNLIMITED_RESOURCES } from '@/game/world/createInitialState'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { hasWebGL } from '@/render/hasWebGL'
import { useSettingsStore } from '@/stores/settingsStore'

const FarmScene = lazy(() => import('@/render/farm3d/FarmScene'))

const SHOWCASE_STATE = createInitialState({
  map: { cells: ['m g m m s', 'mw s g m g', 't tw m g m', 'g m tw s m'] },
  robot: { x: 1, y: 2, facing: 'S' },
  resources: UNLIMITED_RESOURCES,
})

export function HomeScene() {
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const reducedMotion = useReducedMotion()
  const webgl = useMemo(() => hasWebGL(), [])
  if (renderMode === '2d' || !webgl) return <div className="home-scene home-scene--fallback" aria-hidden="true" />
  return (
    <div className="home-scene" aria-hidden="true">
      <Suspense fallback={<div className="home-scene--fallback" />}>
        <FarmScene
          state={SHOWCASE_STATE}
          lastEvents={[]}
          eventKey={0}
          stepDurationMs={0}
          highlightCells={[]}
          failed={false}
          seedKey="home"
          quarterTurns={0}
          zoomLevel={0.75}
          lowGraphics={lowGraphics}
          reducedMotion={reducedMotion}
          showcase
        />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 5: Substituir `src/features/home/HomePage.tsx`**

```tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { Logo } from '@/components/brand/Logo'
import { Modal } from '@/components/ui/Modal'
import { getMission, MISSIONS } from '@/data/missions'
import { HomeScene } from '@/features/home/HomeScene'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { continueMissionId, hasProgress } from '@/game/progress/progression'
import { useProgressStore } from '@/stores/progressStore'
import './HomePage.css'

const TRAINING_ID = 'm0-training'

export function HomePage() {
  const navigate = useNavigate()
  const save = useProgressStore((store) => store.save)
  const resetProgress = useProgressStore((store) => store.resetProgress)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const continueId = continueMissionId(save, MISSIONS)
  const continueMission = continueId ? getMission(continueId) : undefined
  const phases = MISSIONS.filter((mission) => !mission.tutorial)
  const completed = phases.filter((mission) => save.missions[mission.id]?.status === 'completed').length

  const startNew = () => {
    if (hasProgress(save)) {
      setConfirmNew(true)
      return
    }
    navigate(`/jogar/${TRAINING_ID}`)
  }

  return (
    <div className="home">
      <HomeScene />
      <main className="home__panel">
        <h1 className="home__brand">
          <Logo size="lg" />
        </h1>
        <p className="home__tagline">Automatize. Programe. Cultive.</p>
        <p className="home__intro">Construa algoritmos, controle robôs e transforme sua fazenda em um sistema inteligente.</p>
        <div className="home__actions">
          <button type="button" className="home__cta home__cta--primary" onClick={startNew}>
            <Icon name="play" size={22} />
            Iniciar nova fazenda
          </button>
          <button
            type="button"
            className="home__cta home__cta--dark"
            disabled={!continueMission}
            onClick={() => continueMission && navigate(`/jogar/${continueMission.id}`)}
          >
            <Icon name="chart" size={22} />
            <span className="home__cta-text">
              Continuar missão
              {continueMission && (
                <small>{continueMission.tutorial ? continueMission.title : `Fase ${continueMission.order} - ${continueMission.title}`}</small>
              )}
            </span>
          </button>
        </div>
        <div className="home__progress" aria-hidden={false}>
          <span>
            {completed} de {phases.length} fases concluídas
          </span>
          <progress max={phases.length} value={completed} aria-label="Progresso nas fases" />
        </div>
        <nav className="home__links" aria-label="Mais opções">
          <Link to="/como-jogar" className="home__link">
            <Icon name="help" /> Como jogar
          </Link>
          <button type="button" className="home__link" onClick={() => setShowSettings(true)}>
            <Icon name="gear" /> Configurações
          </button>
          <Link to="/missoes" className="home__link">
            <Icon name="flag" /> Missões
          </Link>
          <Link to="/avaliacao/pre" className="home__link">
            <Icon name="book" /> Avaliação
          </Link>
          <Link to="/painel" className="home__link">
            <Icon name="chart" /> Painel do professor
          </Link>
        </nav>
      </main>
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {confirmNew && (
        <Modal title="Começar uma nova fazenda?" onClose={() => setConfirmNew(false)}>
          <p>Isso apaga o progresso, as tentativas e as respostas de avaliação salvas neste navegador.</p>
          <div className="home__confirm">
            <button type="button" className="button" onClick={() => setConfirmNew(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="button button--danger"
              onClick={() => {
                resetProgress()
                navigate(`/jogar/${TRAINING_ID}`)
              }}
            >
              Apagar e começar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Criar `src/features/home/HomePage.css`**

```css
.home {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: var(--chrome-bg);
}

.home-scene {
  position: absolute;
  inset: 0;
}

.home-scene--fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 70% 110%, #4f8f32 0 35%, transparent 36%),
    radial-gradient(ellipse at 20% 105%, #6fae3f 0 40%, transparent 41%),
    linear-gradient(180deg, #a8d8ea 0%, #d8efd0 55%, #8cc65a 56%, #548c36 100%);
}

.home__panel {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  gap: var(--space-4);
  max-width: 520px;
  min-height: 100vh;
  padding: var(--space-6) var(--space-6);
  background: linear-gradient(90deg, rgb(21 34 28 / 0.82) 0%, rgb(21 34 28 / 0.55) 75%, transparent 100%);
  color: var(--chrome-text);
}

.home__brand {
  margin: 0;
}

.home__tagline {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 800;
  color: #b9dca8;
}

.home__intro {
  margin: 0;
  font-size: var(--text-md);
  max-width: 40ch;
}

.home__actions {
  display: grid;
  gap: var(--space-3);
}

.home__cta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 60px;
  padding: 0 var(--space-5);
  border: none;
  border-radius: var(--radius-md);
  font: inherit;
  font-size: var(--text-lg);
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 4px 0 rgb(0 0 0 / 0.25);
}

.home__cta--primary {
  background: var(--green-600);
  color: #fff;
}

.home__cta--dark {
  background: rgb(21 34 28 / 0.92);
  border: 1px solid var(--chrome-border);
  color: var(--chrome-text);
}

.home__cta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.home__cta-text {
  display: grid;
}

.home__cta-text small {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--chrome-text-muted);
}

.home__progress {
  display: grid;
  gap: var(--space-1);
  font-size: var(--text-sm);
}

.home__progress progress {
  width: 100%;
  height: 10px;
  accent-color: var(--green-600);
}

.home__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.home__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--tap-size);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--chrome-border);
  background: rgb(21 34 28 / 0.75);
  color: var(--chrome-text);
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.home__confirm {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

@media (max-width: 640px) {
  .home__panel {
    max-width: none;
    padding: var(--space-5) var(--space-4);
    background: rgb(21 34 28 / 0.82);
  }
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/features/home src/app && npm run typecheck`
Expected: PASS (inclui o teste de `App` da Fase 1).

- [ ] **Step 8: Commit**

```bash
git add src/components/layout src/features/home src/main.tsx
git commit -m "feat(home): add home screen with 3D farm, continue and new farm flows"
```

---

### Task 9.2: Mapa de missões "Seus desafios"

**Files:**
- Create: `src/features/mission-select/missionMapLayout.ts`
- Create: `src/features/mission-select/MissionMapScene.tsx`
- Create: `src/features/mission-select/MissionDetailCard.tsx`
- Create: `src/features/mission-select/MissionSelectPage.tsx`
- Create: `src/features/mission-select/MissionSelectPage.css`
- Modify: `src/app/routes.tsx` (rota `/missoes`)
- Test: `src/features/mission-select/missionMapLayout.test.ts`, `src/features/mission-select/MissionSelectPage.test.tsx`

**Interfaces:**
- Consumes: `MISSIONS`, `useProgressStore`, `MissionStatus`, `MissionProgress`, `CONCEPT_LABELS`, `createInitialState`, `objectiveCells`, `Grid2D`, `PageHeader`, `Icon`, `Tree`, `Barn`, `CameraRig`, `Flat`, `PALETTE`, `createRandom`, `hashString`, `hasWebGL`, `useSettingsStore`, `useReducedMotion`.
- Produces:
  - `NODE_POSITIONS: [number, number][]` (7 nós, índice = `order`)
  - `pathStones(): [number, number][]`
  - `mapScenery(seedKey: string, count: number): { x: number; z: number; scale: number; variant: number }[]`
  - `lockReason(order: number): string`
  - `MissionMapScene({ missions, statuses, selectedId, onSelect })` (default export, `aria-hidden`)
  - `MissionDetailCard({ mission, progress })`
  - `MissionSelectPage` em `/missoes`

- [ ] **Step 1: Escrever testes que falham**

`src/features/mission-select/missionMapLayout.test.ts`:
```ts
import { lockReason, mapScenery, NODE_POSITIONS, pathStones } from '@/features/mission-select/missionMapLayout'

describe('missionMapLayout', () => {
  it('has one distinct node per mission', () => {
    expect(NODE_POSITIONS).toHaveLength(7)
    expect(new Set(NODE_POSITIONS.map(([x, z]) => `${x},${z}`)).size).toBe(7)
  })

  it('lays stones between consecutive nodes', () => {
    expect(pathStones()).toHaveLength(6 * 3)
  })

  it('keeps scenery away from nodes', () => {
    for (const item of mapScenery('map', 40)) {
      for (const [x, z] of NODE_POSITIONS) expect(Math.hypot(item.x - x, item.z - z)).toBeGreaterThan(1.3)
    }
  })

  it('explains why a mission is locked', () => {
    expect(lockReason(3)).toBe('Conclua a fase 2 para desbloquear.')
  })
})
```

`src/features/mission-select/MissionSelectPage.test.tsx`:
```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { MissionSelectPage } from '@/features/mission-select/MissionSelectPage'
import { useProgressStore } from '@/stores/progressStore'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/missoes']}>
      <Routes>
        <Route path="/missoes" element={<MissionSelectPage />} />
        <Route path="/jogar/:missionId" element={<p>jogando</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MissionSelectPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('lists every mission with a textual status', () => {
    renderPage()
    const list = screen.getByRole('list', { name: 'Lista de fases' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(7)
    expect(within(list).getByRole('button', { name: /Fase 1 · Primeira colheita · Disponível/ })).toBeInTheDocument()
    expect(within(list).getByRole('button', { name: /Fase 2 · Plantação em série · Bloqueada/ })).toBeInTheDocument()
  })

  it('shows details and starts an available mission', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Fase 1 · Primeira colheita/ }))
    const card = screen.getByRole('region', { name: 'Fase 1 - Primeira colheita' })
    expect(within(card).getByText('Sequenciamento')).toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: 'Iniciar fase' }))
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })

  it('explains locked missions and disables the start button', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Fase 3 · Irrigação inteligente/ }))
    const card = screen.getByRole('region', { name: 'Fase 3 - Irrigação inteligente' })
    expect(within(card).getByRole('button', { name: 'Iniciar fase' })).toBeDisabled()
    expect(within(card).getByText('Conclua a fase 2 para desbloquear.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/mission-select`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/features/mission-select/missionMapLayout.ts`**

```ts
import { createRandom, hashString } from '@/render/seededRandom'

export const NODE_POSITIONS: [number, number][] = [
  [-6.5, 3.5],
  [-4.2, 1.2],
  [-1.6, 2.6],
  [0.6, 0.2],
  [-1.2, -2.4],
  [2.6, -1.8],
  [5.4, -3.4],
]

const STONES_PER_SEGMENT = 3

export function pathStones(): [number, number][] {
  const stones: [number, number][] = []
  for (let index = 0; index < NODE_POSITIONS.length - 1; index += 1) {
    const [x1, z1] = NODE_POSITIONS[index]
    const [x2, z2] = NODE_POSITIONS[index + 1]
    for (let step = 1; step <= STONES_PER_SEGMENT; step += 1) {
      const t = step / (STONES_PER_SEGMENT + 1)
      stones.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t])
    }
  }
  return stones
}

export function mapScenery(seedKey: string, count: number): { x: number; z: number; scale: number; variant: number }[] {
  const random = createRandom(hashString(seedKey))
  const stones = pathStones()
  const items: { x: number; z: number; scale: number; variant: number }[] = []
  for (let tries = 0; tries < count * 20 && items.length < count; tries += 1) {
    const x = (random() * 2 - 1) * 9
    const z = (random() * 2 - 1) * 6.5
    if (NODE_POSITIONS.some(([nx, nz]) => Math.hypot(nx - x, nz - z) < 1.4)) continue
    if (stones.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 0.8)) continue
    if (items.some((item) => Math.hypot(item.x - x, item.z - z) < 0.9)) continue
    items.push({ x, z, scale: 0.6 + random() * 0.6, variant: Math.floor(random() * 3) })
  }
  return items
}

export function lockReason(order: number): string {
  return `Conclua a fase ${order - 1} para desbloquear.`
}
```

- [ ] **Step 4: Implementar `src/features/mission-select/MissionMapScene.tsx`**

```tsx
import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { Barn, Tree } from '@/render/farm3d/Decorations'
import { Flat } from '@/render/farm3d/materials'
import { PALETTE } from '@/render/palette'
import { mapScenery, NODE_POSITIONS, pathStones } from '@/features/mission-select/missionMapLayout'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { MissionStatus } from '@/game/progress/types'

interface MissionMapSceneProps {
  missions: MissionDefinition[]
  statuses: Record<string, MissionStatus>
  selectedId: string
  onSelect: (id: string) => void
  lowGraphics: boolean
}

const NODE_COLORS: Record<MissionStatus, string> = {
  completed: '#3fa34d',
  available: '#4185d6',
  locked: '#6b7177',
}

const STATUS_MARK: Record<MissionStatus, string> = {
  completed: '✓',
  available: '▶',
  locked: '🔒',
}

const RIVER: [number, number][] = [
  [-9, -1],
  [-6, -0.5],
  [-3.5, -0.8],
  [-2.5, 0.8],
  [-0.5, 1.6],
  [2, 1.4],
  [4, 0.4],
  [6, 1],
  [9, 0.5],
]

export default function MissionMapScene({ missions, statuses, selectedId, onSelect, lowGraphics }: MissionMapSceneProps) {
  const scenery = useMemo(() => mapScenery('mission-map', lowGraphics ? 14 : 38), [lowGraphics])
  const stones = useMemo(() => pathStones(), [])
  return (
    <Canvas orthographic shadows={!lowGraphics} dpr={lowGraphics ? 1 : [1, 2]} camera={{ position: [16, 16, 16], zoom: 40, near: -200, far: 400 }} aria-hidden="true">
      <color attach="background" args={[PALETTE.sky]} />
      <CameraRig gridWidth={14} gridHeight={9} quarterTurns={0} zoomLevel={1.05} showcase={false} reducedMotion />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 0.9]} />
      <directionalLight position={[8, 14, 6]} intensity={1.4} castShadow={!lowGraphics} />
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[22, 0.2, 16]} />
        <Flat color={PALETTE.grassMid} />
      </mesh>
      {RIVER.slice(0, -1).map(([x1, z1], index) => {
        const [x2, z2] = RIVER[index + 1]
        const length = Math.hypot(x2 - x1, z2 - z1)
        return (
          <mesh key={index} position={[(x1 + x2) / 2, 0.01, (z1 + z2) / 2]} rotation={[0, -Math.atan2(z2 - z1, x2 - x1), 0]}>
            <boxGeometry args={[length + 0.4, 0.04, 1.1]} />
            <Flat color={PALETTE.water} />
          </mesh>
        )
      })}
      {stones.map(([x, z], index) => (
        <mesh key={index} position={[x, 0.04, z]}>
          <cylinderGeometry args={[0.18, 0.2, 0.06, 6]} />
          <Flat color={PALETTE.straw} />
        </mesh>
      ))}
      {scenery.map((item, index) => (
        <group key={index} position={[item.x, 0, item.z]} scale={item.scale}>
          <Tree variant={item.variant} />
        </group>
      ))}
      <group position={[-7.6, 0, -3.8]} rotation={[0, Math.PI / 5, 0]} scale={0.8}>
        <Barn />
      </group>
      {missions.map((mission) => {
        const [x, z] = NODE_POSITIONS[mission.order]
        const status = statuses[mission.id] ?? 'locked'
        const selected = mission.id === selectedId
        return (
          <group key={mission.id} position={[x, 0, z]}>
            <mesh
              position={[0, selected ? 0.4 : 0.2, 0]}
              castShadow
              onClick={(event) => {
                event.stopPropagation()
                onSelect(mission.id)
              }}
            >
              <cylinderGeometry args={[0.75, 0.8, 0.35, 6]} />
              <meshStandardMaterial color={NODE_COLORS[status]} flatShading emissive={selected ? NODE_COLORS[status] : '#000000'} emissiveIntensity={selected ? 0.4 : 0} />
            </mesh>
            <Html position={[0, 1.1, 0]} center zIndexRange={[10, 0]}>
              <button type="button" tabIndex={-1} aria-hidden="true" className={`map-label map-label--${status}${selected ? ' is-selected' : ''}`} onClick={() => onSelect(mission.id)}>
                <span className="map-label__mark">{STATUS_MARK[status]}</span>
                <span className="map-label__text">{mission.tutorial ? mission.title : `${mission.order} · ${mission.title}`}</span>
              </button>
            </Html>
          </group>
        )
      })}
    </Canvas>
  )
}
```

- [ ] **Step 5: Implementar `src/features/mission-select/MissionDetailCard.tsx`**

```tsx
import { useNavigate } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { objectiveCells } from '@/features/gameplay/gameplayLogic'
import { lockReason } from '@/features/mission-select/missionMapLayout'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import type { MissionProgress } from '@/game/progress/types'
import { createInitialState } from '@/game/world/createInitialState'
import { Grid2D } from '@/render/grid2d/Grid2D'

const STATUS_TEXT = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' } as const

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3].map((position) => (
        <span key={position} className={position <= value ? 'stars__on' : 'stars__off'} aria-hidden="true">
          <Icon name="star" size={18} />
        </span>
      ))}
    </span>
  )
}

export function MissionDetailCard({ mission, progress }: { mission: MissionDefinition; progress: MissionProgress | undefined }) {
  const navigate = useNavigate()
  const status = progress?.status ?? 'locked'
  const title = mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`
  const best = progress?.bestResult
  return (
    <section className="mission-detail card" aria-label={title}>
      <div className="mission-detail__preview" aria-hidden="true">
        <Grid2D state={createInitialState(mission)} highlightCells={objectiveCells(mission)} failed={false} />
      </div>
      <p className="mission-detail__number">{mission.tutorial ? 'Treinamento' : `Fase ${mission.order}`}</p>
      <h2 className="mission-detail__title">{mission.title}</h2>
      <p>{mission.briefing.goalText}</p>
      <p className="mission-detail__concept">
        <Icon name="bulb" size={18} />
        <span>
          Conceito de programação
          <strong>{CONCEPT_LABELS[mission.concept]}</strong>
        </span>
      </p>
      <div className="mission-detail__meta">
        <span>Dificuldade</span>
        <Stars value={mission.difficulty} label={`Dificuldade ${mission.difficulty} de 3`} />
      </div>
      <p className={`mission-detail__status mission-detail__status--${status}`}>
        <Icon name={status === 'completed' ? 'check' : status === 'locked' ? 'lock' : 'play'} size={16} /> {STATUS_TEXT[status]}
        {progress && progress.attempts > 0 && ` · ${progress.attempts} tentativa(s)`}
      </p>
      <p className="mission-detail__best">
        {best ? (
          <>
            Melhor resultado: <Stars value={best.efficiencyStars} label={`Eficiência ${best.efficiencyStars} de 3`} /> · {best.actions} comandos ·{' '}
            {best.blocks} blocos
          </>
        ) : (
          'Ainda sem resultado.'
        )}
      </p>
      {status === 'locked' && <p className="mission-detail__lock">{lockReason(mission.order)}</p>}
      <button type="button" className="button button--primary mission-detail__start" disabled={status === 'locked'} onClick={() => navigate(`/jogar/${mission.id}`)}>
        {status === 'completed' ? 'Jogar de novo' : 'Iniciar fase'}
      </button>
    </section>
  )
}
```

O botão de uma missão concluída diz "Jogar de novo"; o teste usa uma missão disponível ("Iniciar fase").

- [ ] **Step 6: Implementar `src/features/mission-select/MissionSelectPage.tsx`**

```tsx
import { lazy, Suspense, useMemo, useState } from 'react'
import { Icon } from '@/components/icons/Icon'
import { PageHeader } from '@/components/layout/PageHeader'
import { MISSIONS } from '@/data/missions'
import { MissionDetailCard } from '@/features/mission-select/MissionDetailCard'
import { continueMissionId } from '@/game/progress/progression'
import type { MissionStatus } from '@/game/progress/types'
import { hasWebGL } from '@/render/hasWebGL'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import './MissionSelectPage.css'

const MissionMapScene = lazy(() => import('@/features/mission-select/MissionMapScene'))

const STATUS_TEXT: Record<MissionStatus, string> = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' }

export function MissionSelectPage() {
  const save = useProgressStore((store) => store.save)
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const webgl = useMemo(() => hasWebGL(), [])
  const [selectedId, setSelectedId] = useState(() => continueMissionId(save, MISSIONS) ?? 'm0-training')
  const statuses = Object.fromEntries(MISSIONS.map((mission) => [mission.id, save.missions[mission.id]?.status ?? 'locked'])) as Record<string, MissionStatus>
  const selected = MISSIONS.find((mission) => mission.id === selectedId) ?? MISSIONS[0]
  const show3d = renderMode !== '2d' && webgl

  return (
    <div className="chrome-page mission-select">
      <PageHeader title="Seus desafios" subtitle="Complete as missões e aprenda novos conceitos de programação." backTo="/" />
      <div className={`mission-select__body${show3d ? '' : ' mission-select__body--flat'}`}>
        {show3d && (
          <div className="mission-select__map">
            <Suspense fallback={<div className="mission-select__loading">Carregando mapa…</div>}>
              <MissionMapScene missions={MISSIONS} statuses={statuses} selectedId={selected.id} onSelect={setSelectedId} lowGraphics={lowGraphics} />
            </Suspense>
          </div>
        )}
        <ol className="mission-list" aria-label="Lista de fases">
          {MISSIONS.map((mission) => {
            const status = statuses[mission.id]
            const name = mission.tutorial ? `Treinamento · ${STATUS_TEXT[status]}` : `Fase ${mission.order} · ${mission.title} · ${STATUS_TEXT[status]}`
            return (
              <li key={mission.id}>
                <button
                  type="button"
                  className={`mission-list__item mission-list__item--${status}`}
                  aria-pressed={mission.id === selected.id}
                  aria-label={name}
                  onClick={() => setSelectedId(mission.id)}
                >
                  <span className="mission-list__badge" aria-hidden="true">
                    {status === 'locked' ? <Icon name="lock" size={16} /> : status === 'completed' ? <Icon name="check" size={16} /> : mission.order}
                  </span>
                  <span className="mission-list__name">{mission.tutorial ? 'Treinamento' : mission.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
        <MissionDetailCard mission={selected} progress={save.missions[selected.id]} />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Criar `src/features/mission-select/MissionSelectPage.css`**

```css
.mission-select__body {
  display: grid;
  grid-template-columns: 1fr 340px;
  grid-template-rows: 1fr auto;
  gap: var(--space-3);
  padding: 0 var(--space-5) var(--space-5);
  min-height: calc(100vh - 96px);
}

.mission-select__map {
  grid-row: 1;
  grid-column: 1;
  min-height: 460px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.mission-select__loading {
  display: grid;
  place-items: center;
  height: 100%;
  background: #a8d8ea;
  color: var(--green-900);
}

.mission-list {
  grid-row: 2;
  grid-column: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.mission-list__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--tap-size);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: 2px solid var(--chrome-border);
  background: var(--chrome-surface);
  color: var(--chrome-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.mission-list__item[aria-pressed='true'] {
  border-color: var(--water-500);
  box-shadow: 0 0 0 3px rgb(65 133 214 / 0.35);
}

.mission-list__badge {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--water-500);
  color: #fff;
  font-weight: 800;
}

.mission-list__item--completed .mission-list__badge {
  background: var(--green-600);
}

.mission-list__item--locked {
  color: var(--chrome-text-muted);
}

.mission-list__item--locked .mission-list__badge {
  background: #6b7177;
}

.mission-detail {
  grid-row: 1 / span 2;
  grid-column: 2;
  display: grid;
  align-content: start;
  gap: var(--space-2);
}

.mission-detail__preview {
  border-radius: var(--radius-md);
  overflow: hidden;
  max-height: 170px;
}

.mission-detail__preview .grid2d {
  padding: var(--space-2);
  gap: 2px;
}

.mission-detail__preview .grid2d__cell {
  font-size: 12px;
}

.mission-detail__number {
  margin: 0;
  font-weight: 700;
  color: var(--color-text-muted);
}

.mission-detail__title {
  margin: 0;
  font-size: var(--text-xl);
}

.mission-detail__concept {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
}

.mission-detail__concept strong {
  display: block;
}

.mission-detail__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-sm);
}

.stars {
  display: inline-flex;
  gap: 2px;
  vertical-align: middle;
}

.stars__on {
  color: var(--sun-400);
}

.stars__off {
  color: #c9d0cc;
}

.mission-detail__status,
.mission-detail__best,
.mission-detail__lock {
  margin: 0;
  font-size: var(--text-sm);
}

.mission-detail__status {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: 700;
}

.mission-detail__status--completed {
  color: var(--color-success);
}

.mission-detail__lock {
  color: var(--color-danger);
}

.mission-detail__start {
  min-height: 52px;
  font-size: var(--text-md);
}

.map-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 2px solid rgb(255 255 255 / 0.6);
  background: rgb(21 34 28 / 0.88);
  color: #fff;
  font: 600 13px/1.1 var(--font-sans);
  white-space: nowrap;
  cursor: pointer;
}

.map-label--completed .map-label__mark {
  color: #7ccf6a;
}

.map-label--available {
  background: rgb(65 133 214 / 0.95);
}

.map-label--locked {
  opacity: 0.8;
}

.map-label.is-selected {
  outline: 3px solid var(--sun-400);
}

.mission-select__body--flat {
  grid-template-columns: 1fr 340px;
  grid-template-rows: auto;
}

.mission-select__body--flat .mission-list {
  grid-row: 1;
  flex-direction: column;
  align-content: start;
}

@media (max-width: 900px) {
  .mission-select__body,
  .mission-select__body--flat {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .mission-select__map {
    display: none;
  }

  .mission-list {
    grid-row: auto;
    flex-direction: column;
  }

  .mission-detail {
    grid-row: auto;
    grid-column: auto;
  }
}
```

- [ ] **Step 8: Registrar rota em `src/app/routes.tsx`**

Adicionar o import `import { MissionSelectPage } from '@/features/mission-select/MissionSelectPage'` e a entrada `{ path: '/missoes', element: <MissionSelectPage /> },` antes de `'/jogar/:missionId'`.

- [ ] **Step 9: Rodar e ver passar**

Run: `npx vitest run src/features/mission-select && npm run typecheck`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/features/mission-select src/app/routes.tsx
git commit -m "feat(missions): add 3D mission map with accessible list and detail card"
```

---

### Task 9.3: Tela de resultado

**Files:**
- Create: `src/features/results/resultsLogic.ts`
- Create: `src/features/results/CelebrationScene.tsx`
- Create: `src/features/results/ResultsPage.tsx`
- Create: `src/features/results/ResultsPage.css`
- Modify: `src/app/routes.tsx` (rota `/resultado/:missionId`)
- Test: `src/features/results/resultsLogic.test.ts`, `src/features/results/ResultsPage.test.tsx`

**Interfaces:**
- Consumes: `SaveData`, `AttemptRecord`, `MissionDefinition`, `getMission`, `getNextMission`, `runProgram`, `toControllerMission`, `programToPseudocode`, `CONCEPT_LABELS`, `useProgressStore`, `RobotBody`, `Barn`, `Windmill`, `Tree`, `CameraRig`, `hasWebGL`, `useReducedMotion`.
- Produces:
  - `latestSuccess(save: SaveData, missionId: string): AttemptRecord | null`
  - `previousBestBefore(save: SaveData, attempt: AttemptRecord): AttemptRecord | null` (melhor sucesso anterior a esta tentativa)
  - `referenceStats(mission: MissionDefinition): { actions: number; blocks: number; pseudocode: string }`
  - `CONCEPT_TIPS: Record<MissionConcept, string>`
  - `nextStep(mission: MissionDefinition, save: SaveData): { label: string; to: string }`
  - `ResultsPage` em `/resultado/:missionId`; sem sucesso registrado → `<Navigate to="/jogar/:missionId" replace />`

- [ ] **Step 1: Escrever testes que falham**

`src/features/results/resultsLogic.test.ts`:
```ts
import { latestSuccess, nextStep, previousBestBefore, referenceStats } from '@/features/results/resultsLogic'
import { createInitialSave, recordAttempt } from '@/game/progress/progression'
import { getMission, MISSIONS } from '@/data/missions'
import type { AttemptInput } from '@/game/progress/types'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))
const base = (actions: number, outcome: AttemptInput['outcome'] = 'success'): AttemptInput => ({
  missionId: 'm2-row-planting',
  timestamp: '2026-10-14T12:00:00.000Z',
  outcome,
  errorCode: null,
  actions,
  blocks: 4,
  usage: { seeds: 6, water: 0, energy: actions },
  efficiencyStars: outcome === 'success' ? 3 : null,
  pseudocode: 'x',
})

describe('resultsLogic', () => {
  it('finds the latest success and the best success before it', () => {
    let save = createInitialSave(refs, 'now')
    save = recordAttempt(save, base(18), refs)
    save = recordAttempt(save, base(30, 'error'), refs)
    save = recordAttempt(save, base(20), refs)
    const latest = latestSuccess(save, 'm2-row-planting')
    expect(latest?.attemptNumber).toBe(3)
    expect(latest && previousBestBefore(save, latest)?.actions).toBe(18)
  })

  it('computes reference stats by running the reference solution', () => {
    const mission = getMission('m2-row-planting')
    if (!mission) throw new Error('missing')
    const stats = referenceStats(mission)
    expect(stats.actions).toBe(18)
    expect(stats.pseudocode).toContain('repita 6 vezes')
  })

  it('points to the next mission, or to the final assessment after the last one', () => {
    const save = createInitialSave(refs, 'now')
    const second = getMission('m2-row-planting')
    const last = getMission('m6-efficient-farm')
    if (!second || !last) throw new Error('missing')
    expect(nextStep(second, save)).toEqual({ label: 'Próxima fase', to: '/jogar/m3-smart-irrigation' })
    expect(nextStep(last, save)).toEqual({ label: 'Fazer avaliação final', to: '/avaliacao/pos' })
    expect(nextStep(last, { ...save, assessments: { pre: null, post: { form: 'post', startedAt: '', completedAt: '', skipped: false, answers: {} } } })).toEqual({
      label: 'Voltar às missões',
      to: '/missoes',
    })
  })
})
```

`src/features/results/ResultsPage.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ResultsPage } from '@/features/results/ResultsPage'
import { useProgressStore } from '@/stores/progressStore'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/resultado/:missionId" element={<ResultsPage />} />
        <Route path="/jogar/:missionId" element={<p>jogando</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResultsPage', () => {
  beforeEach(() => useProgressStore.getState().resetProgress())

  it('redirects to the mission when there is no success yet', () => {
    renderAt('/resultado/m1-first-harvest')
    expect(screen.getByText('jogando')).toBeInTheDocument()
  })

  it('shows real attempt data, separates correctness from efficiency and links forward', () => {
    useProgressStore.getState().recordAttempt({
      missionId: 'm1-first-harvest',
      timestamp: '2026-10-14T12:00:00.000Z',
      outcome: 'error',
      errorCode: 'HIT_OBSTACLE',
      actions: 2,
      blocks: 8,
      usage: { seeds: 0, water: 0, energy: 2 },
      efficiencyStars: null,
      pseudocode: '',
    })
    useProgressStore.getState().recordAttempt({
      missionId: 'm1-first-harvest',
      timestamp: '2026-10-14T12:01:00.000Z',
      outcome: 'success',
      errorCode: null,
      actions: 12,
      blocks: 10,
      usage: { seeds: 0, water: 0, energy: 11 },
      efficiencyStars: 1,
      pseudocode: 'quando executar:\n    mover para frente',
    })
    renderAt('/resultado/m1-first-harvest')
    expect(screen.getByRole('heading', { name: 'Missão concluída!' })).toBeInTheDocument()
    expect(screen.getByLabelText('Comandos executados')).toHaveTextContent('12')
    expect(screen.getByLabelText('Tentativas')).toHaveTextContent('2')
    expect(screen.getByText('Solução correta')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Eficiência 1 de 3' })).toBeInTheDocument()
    expect(screen.getByText('Sequenciamento')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Próxima fase' })).toHaveAttribute('href', '/jogar/m2-row-planting')
    expect(screen.getByRole('link', { name: 'Tentar melhorar' })).toHaveAttribute('href', '/jogar/m1-first-harvest')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/results`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/features/results/resultsLogic.ts`**

```ts
import { runProgram } from '@/blocks/interpreter/runProgram'
import { programToPseudocode } from '@/blocks/pseudocode/pseudocode'
import { getNextMission } from '@/data/missions'
import type { MissionConcept, MissionDefinition } from '@/game/missions/missionTypes'
import { toControllerMission } from '@/game/missions/toControllerMission'
import type { AttemptRecord, SaveData } from '@/game/progress/types'

export function latestSuccess(save: SaveData, missionId: string): AttemptRecord | null {
  const successes = save.attempts.filter((attempt) => attempt.missionId === missionId && attempt.outcome === 'success')
  return successes.at(-1) ?? null
}

export function previousBestBefore(save: SaveData, attempt: AttemptRecord): AttemptRecord | null {
  const earlier = save.attempts.filter(
    (candidate) =>
      candidate.missionId === attempt.missionId && candidate.outcome === 'success' && candidate.attemptNumber < attempt.attemptNumber,
  )
  return earlier.reduce<AttemptRecord | null>((best, candidate) => {
    if (!best) return candidate
    const candidateStars = candidate.efficiencyStars ?? 0
    const bestStars = best.efficiencyStars ?? 0
    if (candidateStars !== bestStars) return candidateStars > bestStars ? candidate : best
    return candidate.actions < best.actions ? candidate : best
  }, null)
}

export function referenceStats(mission: MissionDefinition): { actions: number; blocks: number; pseudocode: string } {
  const controllerMission = toControllerMission(mission)
  const result = runProgram(mission.referenceSolution, controllerMission.initialState, controllerMission.rules, controllerMission.stepLimit)
  return {
    actions: result.state.actionCount,
    blocks: mission.efficiency.referenceBlocks,
    pseudocode: programToPseudocode(mission.referenceSolution),
  }
}

export const CONCEPT_TIPS: Record<MissionConcept, string> = {
  interface: 'Leia o console depois de cada execução: ele conta exatamente o que o robô fez.',
  sequencing: 'Antes de montar, descreva o caminho em voz alta. A ordem dos blocos é a ordem das ações.',
  repetition: 'Use laços sempre que perceber um padrão de ações repetidas. Isso deixa o programa mais curto e fácil de entender.',
  conditionals: 'Condições deixam o robô reagir ao mundo. Pergunte antes de agir quando o estado do canteiro pode variar.',
  sensors: 'O laço "enquanto" funciona para qualquer tamanho de fileira, porque depende do que o sensor percebe.',
  variables: 'Variáveis são a memória do programa. Dê nomes que expliquem o que elas contam.',
  efficiency: 'Execute passo a passo para encontrar bugs. Procedimentos dão nome a um grupo de ações e evitam repetição.',
}

export function nextStep(mission: MissionDefinition, save: SaveData): { label: string; to: string } {
  const next = getNextMission(mission.id)
  if (next) return { label: 'Próxima fase', to: `/jogar/${next.id}` }
  if (!save.assessments.post) return { label: 'Fazer avaliação final', to: '/avaliacao/pos' }
  return { label: 'Voltar às missões', to: '/missoes' }
}
```

- [ ] **Step 4: Implementar `src/features/results/CelebrationScene.tsx`**

```tsx
import { Canvas } from '@react-three/fiber'
import { CameraRig } from '@/render/farm3d/CameraRig'
import { Barn, Tree, Windmill } from '@/render/farm3d/Decorations'
import { Flat } from '@/render/farm3d/materials'
import { RobotBody } from '@/render/farm3d/RobotModel'
import { PALETTE } from '@/render/palette'

export default function CelebrationScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Canvas orthographic dpr={[1, 2]} camera={{ position: [10, 10, 10], zoom: 60, near: -100, far: 200 }} aria-hidden="true">
      <color attach="background" args={[PALETTE.sky]} />
      <CameraRig gridWidth={3} gridHeight={3} quarterTurns={0} zoomLevel={0.9} showcase reducedMotion={reducedMotion} />
      <hemisphereLight args={['#f1f8ff', PALETTE.grassDark, 1]} />
      <directionalLight position={[6, 10, 4]} intensity={1.4} />
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[14, 0.1, 14]} />
        <Flat color={PALETTE.grassLight} />
      </mesh>
      <group scale={1.6}>
        <RobotBody />
      </group>
      <group position={[0.2, 0.55, 0.9]}>
        <mesh>
          <boxGeometry args={[0.9, 0.35, 0.55]} />
          <Flat color={PALETTE.crate} />
        </mesh>
        {[-0.28, -0.08, 0.12, 0.3].map((x, index) => (
          <mesh key={x} position={[x, 0.24, (index % 2) * 0.12 - 0.06]}>
            <icosahedronGeometry args={[0.12, 1]} />
            <Flat color={index % 3 === 0 ? PALETTE.fruitAlt : PALETTE.fruit} />
          </mesh>
        ))}
      </group>
      <group position={[-3.5, 0, -3]} scale={0.8}>
        <Barn />
      </group>
      <group position={[3.2, 0, -3.2]} scale={0.8}>
        <Windmill animate={!reducedMotion} />
      </group>
      <group position={[-3, 0, 2.5]}>
        <Tree />
      </group>
    </Canvas>
  )
}
```

- [ ] **Step 5: Implementar `src/features/results/ResultsPage.tsx`**

```tsx
import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { getMission } from '@/data/missions'
import { CONCEPT_TIPS, latestSuccess, nextStep, previousBestBefore, referenceStats } from '@/features/results/resultsLogic'
import { CONCEPT_LABELS } from '@/game/missions/missionTypes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { hasWebGL } from '@/render/hasWebGL'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import './ResultsPage.css'

const CelebrationScene = lazy(() => import('@/features/results/CelebrationScene'))

function Stars({ value }: { value: number }) {
  return (
    <span className="stars" role="img" aria-label={`Eficiência ${value} de 3`}>
      {[1, 2, 3].map((position) => (
        <span key={position} className={position <= value ? 'stars__on' : 'stars__off'} aria-hidden="true">
          <Icon name="star" size={20} />
        </span>
      ))}
    </span>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="result-stat" role="group" aria-label={label}>
      <span className="result-stat__label" aria-hidden="true">
        {label}
      </span>
      <span className="result-stat__value">{children}</span>
    </div>
  )
}

export function ResultsPage() {
  const { missionId = '' } = useParams()
  const mission = getMission(missionId)
  const save = useProgressStore((store) => store.save)
  const renderMode = useSettingsStore((store) => store.settings.renderMode)
  const reducedMotion = useReducedMotion()
  const webgl = useMemo(() => hasWebGL(), [])
  const [showSolution, setShowSolution] = useState(false)
  const attempt = mission ? latestSuccess(save, mission.id) : null
  const reference = useMemo(() => (mission ? referenceStats(mission) : null), [mission])

  if (!mission) return <Navigate to="/missoes" replace />
  if (!attempt || !reference) return <Navigate to={`/jogar/${mission.id}`} replace />

  const previous = previousBestBefore(save, attempt)
  const progress = save.missions[mission.id]
  const next = nextStep(mission, save)
  const show3d = renderMode !== '2d' && webgl

  return (
    <div className="results">
      <div className="results__scene" aria-hidden="true">
        {show3d ? (
          <Suspense fallback={null}>
            <CelebrationScene reducedMotion={reducedMotion} />
          </Suspense>
        ) : (
          <div className="home-scene--fallback" />
        )}
        {!reducedMotion && <div className="results__confetti" />}
      </div>

      <main className="results__content">
        <section className="results__card card" aria-labelledby="results-title">
          <div className="results__head">
            <span className="results__star" aria-hidden="true">
              <Icon name="star" size={48} />
            </span>
            <div>
              <h1 id="results-title" className="results__title">
                Missão concluída!
              </h1>
              <p className="results__goal">{mission.briefing.goalText}</p>
            </div>
          </div>

          <div className="results__verdict">
            <span className="results__correct">
              <Icon name="check" /> Solução correta
            </span>
            <Stars value={attempt.efficiencyStars ?? 1} />
          </div>
          <p className="results__note">A eficiência é avaliada à parte: uma solução correta nunca é reprovada por usar mais comandos.</p>

          <div className="results__stats">
            <Stat label="Comandos executados">{attempt.actions}</Stat>
            <Stat label="Tentativas">{progress?.attempts ?? attempt.attemptNumber}</Stat>
            <Stat label="Blocos usados">{attempt.blocks}</Stat>
            <Stat label="Dicas usadas">{attempt.hintsUsed}</Stat>
            <Stat label="Recursos consumidos">
              <span className="results__resources">
                <span>
                  <Icon name="seed" size={16} /> {attempt.usage.seeds}
                </span>
                <span>
                  <Icon name="drop" size={16} /> {attempt.usage.water}
                </span>
                <span>
                  <Icon name="bolt" size={16} /> {attempt.usage.energy}
                </span>
              </span>
            </Stat>
            <div className="results__concept">
              <Icon name="check" />
              <span>
                Conceito aprendido
                <strong>{CONCEPT_LABELS[mission.concept]}</strong>
              </span>
            </div>
          </div>

          {previous && (
            <p className="results__compare">
              Comparado com sua melhor solução anterior: {previous.actions} → {attempt.actions} comandos, {previous.blocks} → {attempt.blocks} blocos.
            </p>
          )}

          <div className="results__actions">
            <button type="button" className="button" aria-expanded={showSolution} onClick={() => setShowSolution((value) => !value)}>
              <Icon name="book" /> {showSolution ? 'Ocultar explicação' : 'Ver solução'}
            </button>
            <Link to={`/jogar/${mission.id}`} className="button">
              <Icon name="reset" /> Tentar melhorar
            </Link>
            <Link to={next.to} className="button button--primary">
              {next.label}
            </Link>
          </div>
        </section>

        {showSolution && (
          <section className="results__explain card" aria-labelledby="explain-title">
            <h2 id="explain-title">Como funciona?</h2>
            <p>{mission.solutionExplanation}</p>
            <div className="results__columns">
              <figure>
                <figcaption>O seu algoritmo</figcaption>
                <pre>{attempt.pseudocode}</pre>
              </figure>
              <figure>
                <figcaption>Uma solução de referência (existem outras corretas)</figcaption>
                <pre>{reference.pseudocode}</pre>
              </figure>
            </div>
            <table className="results__table">
              <caption>Comparação entre soluções corretas</caption>
              <thead>
                <tr>
                  <th scope="col">Medida</th>
                  <th scope="col">Sua solução</th>
                  <th scope="col">Referência</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Comandos executados</th>
                  <td>{attempt.actions}</td>
                  <td>{reference.actions}</td>
                </tr>
                <tr>
                  <th scope="row">Blocos usados</th>
                  <td>{attempt.blocks}</td>
                  <td>{reference.blocks}</td>
                </tr>
              </tbody>
            </table>
            <aside className="results__tip">
              <Icon name="bulb" />
              <div>
                <strong>Dica</strong>
                <p>{CONCEPT_TIPS[mission.concept]}</p>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 6: Criar `src/features/results/ResultsPage.css`**

```css
.results {
  position: relative;
  min-height: 100vh;
  background: var(--chrome-bg);
}

.results__scene {
  position: fixed;
  inset: 0;
}

.results__confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle, #e2533b 3px, transparent 4px),
    radial-gradient(circle, #f2c14e 3px, transparent 4px),
    radial-gradient(circle, #4185d6 3px, transparent 4px),
    radial-gradient(circle, #3fa34d 3px, transparent 4px);
  background-size: 120px 140px, 90px 110px, 150px 130px, 110px 150px;
  background-position: 0 0, 40px 60px, 80px 20px, 20px 90px;
  animation: confetti-fall 6s linear infinite;
  opacity: 0.8;
}

@keyframes confetti-fall {
  to {
    background-position: 0 560px, 40px 500px, 80px 540px, 20px 690px;
  }
}

.results__content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: var(--space-4);
  justify-items: end;
  padding: var(--space-6) var(--space-5);
}

.results__card,
.results__explain {
  width: min(560px, 100%);
}

.results__head {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.results__star {
  color: var(--sun-400);
}

.results__title {
  margin: 0;
  font-size: var(--text-xl);
}

.results__goal {
  margin: 0;
  color: var(--color-text-muted);
}

.results__verdict {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-3);
}

.results__correct {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: 700;
  color: var(--color-success);
}

.results__note,
.results__compare {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.results__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.result-stat {
  display: grid;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.result-stat__label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.result-stat__value {
  font-size: var(--text-lg);
  font-weight: 800;
}

.results__resources {
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-md);
}

.results__resources span {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.results__concept {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: #e6f4e3;
  color: #1f5a2c;
  font-size: var(--text-sm);
}

.results__concept strong {
  display: block;
}

.results__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.results__actions .button--primary {
  flex: 1;
}

.results__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.results__columns figure {
  margin: 0;
}

.results__columns figcaption {
  font-size: var(--text-sm);
  font-weight: 700;
}

.results__columns pre {
  margin: var(--space-2) 0 0;
  padding: var(--space-3);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  overflow: auto;
}

.results__table {
  width: 100%;
  margin-top: var(--space-4);
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.results__table caption {
  text-align: left;
  font-weight: 700;
  padding-bottom: var(--space-2);
}

.results__table th,
.results__table td {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.results__tip {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: #fdf3d8;
  color: #3a2e0c;
}

.results__tip p {
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  .results__confetti {
    display: none;
  }
}

@media (max-width: 760px) {
  .results__content {
    justify-items: stretch;
    padding: var(--space-4);
  }

  .results__columns,
  .results__stats {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Registrar rota em `src/app/routes.tsx`**

Adicionar `import { ResultsPage } from '@/features/results/ResultsPage'` e `{ path: '/resultado/:missionId', element: <ResultsPage /> },`.

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run src/features/results && npm run typecheck`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/results src/app/routes.tsx
git commit -m "feat(results): add result screen with real stats, efficiency rating and solution explanation"
```

---

### Task 9.4: "Como jogar" e áudio

**Files:**
- Create: `src/features/how-to-play/HowToPlayPage.tsx`, `src/features/how-to-play/HowToPlayPage.css`
- Create: `src/services/audio/sounds.ts`
- Create: `src/services/audio/sfxPlayer.ts`
- Create: `src/services/audio/useGameAudio.ts`
- Create: `src/app/MusicPlayer.tsx`
- Modify: `src/features/gameplay/GameplayPage.tsx` (chamar `useGameAudio(snapshot)`)
- Modify: `src/app/App.tsx` (montar `<MusicPlayer />`)
- Modify: `src/app/routes.tsx` (rota `/como-jogar`)
- Create: `public/audio/README.md`
- Test: `src/services/audio/sounds.test.ts`, `src/features/how-to-play/HowToPlayPage.test.tsx`

**Interfaces:**
- Consumes: `GameEvent`, `ExecutionSnapshot`, `useSettingsStore`, `PageHeader`, `Icon`.
- Produces:
  - `type SoundName = 'move' | 'turn' | 'plant' | 'water' | 'harvest' | 'collect' | 'error' | 'success'`
  - `soundsForEvents(events: GameEvent[]): SoundName[]` (sem repetição, ordem de aparição)
  - `createSfxPlayer(): { play(name: SoundName): void }` (AudioContext criado sob demanda; falha silenciosa)
  - `useGameAudio(snapshot: ExecutionSnapshot): void`
  - `MusicPlayer()` — toca `audio/theme.ogg` em loop quando `musicEnabled`; arquivo ausente ou bloqueio de autoplay não quebram nada
  - `HowToPlayPage` em `/como-jogar`

- [ ] **Step 1: Escrever testes que falham**

`src/services/audio/sounds.test.ts`:
```ts
import { soundsForEvents } from '@/services/audio/sounds'

describe('soundsForEvents', () => {
  it('maps engine events to sounds without duplicates', () => {
    expect(
      soundsForEvents([
        { type: 'robotMoved', from: { x: 0, y: 0 }, to: { x: 1, y: 0 } },
        { type: 'resourceChanged', resource: 'energy', value: 3 },
        { type: 'plotChanged', x: 1, y: 0, from: 'tilled', to: 'seeded' },
        { type: 'plotChanged', x: 2, y: 0, from: 'seeded', to: 'growing' },
        { type: 'moistureChanged', x: 1, y: 0, moisture: 'wet' },
        { type: 'moistureChanged', x: 2, y: 0, moisture: 'dry' },
      ]),
    ).toEqual(['move', 'plant', 'water'])
  })

  it('maps turns, harvests and refills', () => {
    expect(
      soundsForEvents([
        { type: 'robotTurned', facing: 'N' },
        { type: 'plotChanged', x: 0, y: 0, from: 'mature', to: 'harvested' },
        { type: 'resourcesCollected', resource: 'water', amount: 3 },
      ]),
    ).toEqual(['turn', 'harvest', 'collect'])
  })
})
```

`src/features/how-to-play/HowToPlayPage.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { HowToPlayPage } from '@/features/how-to-play/HowToPlayPage'

describe('HowToPlayPage', () => {
  it('explains the loop and links to the interactive training', () => {
    render(
      <MemoryRouter>
        <HowToPlayPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Como jogar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fazer o treinamento interativo' })).toHaveAttribute('href', '/jogar/m0-training')
    expect(screen.getByText(/aprender a construir e compreender algoritmos/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/services/audio src/features/how-to-play`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/services/audio/sounds.ts`**

```ts
import type { GameEvent } from '@/game/world/types'

export type SoundName = 'move' | 'turn' | 'plant' | 'water' | 'harvest' | 'collect' | 'error' | 'success'

function soundFor(event: GameEvent): SoundName | null {
  switch (event.type) {
    case 'robotMoved':
      return 'move'
    case 'robotTurned':
      return 'turn'
    case 'plotChanged':
      if (event.to === 'harvested') return 'harvest'
      if (event.to === 'seeded' || event.to === 'tilled') return 'plant'
      return null
    case 'moistureChanged':
      return event.moisture === 'wet' ? 'water' : null
    case 'resourcesCollected':
      return 'collect'
    case 'resourceChanged':
      return null
  }
}

export function soundsForEvents(events: GameEvent[]): SoundName[] {
  const result: SoundName[] = []
  for (const event of events) {
    const sound = soundFor(event)
    if (sound && !result.includes(sound)) result.push(sound)
  }
  return result
}
```

- [ ] **Step 4: Implementar `src/services/audio/sfxPlayer.ts`**

```ts
import type { SoundName } from '@/services/audio/sounds'

interface Tone {
  frequency: number
  slideTo: number
  duration: number
  type: OscillatorType
  gain: number
}

const TONES: Record<SoundName, Tone[]> = {
  move: [{ frequency: 220, slideTo: 260, duration: 0.08, type: 'triangle', gain: 0.08 }],
  turn: [{ frequency: 330, slideTo: 300, duration: 0.06, type: 'triangle', gain: 0.06 }],
  plant: [{ frequency: 180, slideTo: 120, duration: 0.12, type: 'sine', gain: 0.12 }],
  water: [{ frequency: 900, slideTo: 500, duration: 0.18, type: 'sine', gain: 0.07 }],
  harvest: [
    { frequency: 520, slideTo: 520, duration: 0.08, type: 'square', gain: 0.05 },
    { frequency: 780, slideTo: 780, duration: 0.12, type: 'square', gain: 0.05 },
  ],
  collect: [{ frequency: 440, slideTo: 880, duration: 0.2, type: 'sine', gain: 0.07 }],
  error: [{ frequency: 200, slideTo: 90, duration: 0.35, type: 'sawtooth', gain: 0.06 }],
  success: [
    { frequency: 523, slideTo: 523, duration: 0.12, type: 'triangle', gain: 0.08 },
    { frequency: 659, slideTo: 659, duration: 0.12, type: 'triangle', gain: 0.08 },
    { frequency: 784, slideTo: 784, duration: 0.25, type: 'triangle', gain: 0.08 },
  ],
}

export function createSfxPlayer(): { play(name: SoundName): void } {
  let context: AudioContext | null = null
  return {
    play(name) {
      try {
        context ??= new AudioContext()
        let start = context.currentTime
        for (const tone of TONES[name]) {
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          oscillator.type = tone.type
          oscillator.frequency.setValueAtTime(tone.frequency, start)
          oscillator.frequency.linearRampToValueAtTime(tone.slideTo, start + tone.duration)
          gain.gain.setValueAtTime(tone.gain, start)
          gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)
          oscillator.connect(gain).connect(context.destination)
          oscillator.start(start)
          oscillator.stop(start + tone.duration)
          start += tone.duration
        }
      } catch {
        context = null
      }
    },
  }
}
```

- [ ] **Step 5: Implementar `src/services/audio/useGameAudio.ts`**

```ts
import { useEffect, useMemo, useRef } from 'react'
import type { ExecutionSnapshot } from '@/game/execution/types'
import { createSfxPlayer } from '@/services/audio/sfxPlayer'
import { soundsForEvents } from '@/services/audio/sounds'
import { useSettingsStore } from '@/stores/settingsStore'

export function useGameAudio(snapshot: ExecutionSnapshot): void {
  const enabled = useSettingsStore((store) => store.settings.soundEnabled)
  const player = useMemo(() => createSfxPlayer(), [])
  const lastStep = useRef(snapshot.stepCount)
  const lastStatus = useRef(snapshot.status)

  useEffect(() => {
    if (!enabled) {
      lastStep.current = snapshot.stepCount
      lastStatus.current = snapshot.status
      return
    }
    if (snapshot.stepCount !== lastStep.current) {
      lastStep.current = snapshot.stepCount
      for (const sound of soundsForEvents(snapshot.lastEvents)) player.play(sound)
    }
    if (snapshot.status !== lastStatus.current) {
      lastStatus.current = snapshot.status
      if (snapshot.status === 'failed') player.play('error')
      if (snapshot.status === 'finished' && snapshot.validation?.success) player.play('success')
    }
  }, [snapshot, enabled, player])
}
```

Em `GameplayScreen` (`src/features/gameplay/GameplayPage.tsx`), importar `useGameAudio` de `@/services/audio/useGameAudio` e chamar `useGameAudio(snapshot)` logo após `const { snapshot, controller } = session`.

- [ ] **Step 6: Implementar `src/app/MusicPlayer.tsx` e montar em `App`**

```tsx
import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

const TRACK = `${import.meta.env.BASE_URL}audio/theme.ogg`

export function MusicPlayer() {
  const enabled = useSettingsStore((store) => store.settings.musicEnabled)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!enabled) {
      audioRef.current?.pause()
      return
    }
    const audio = audioRef.current ?? new Audio(TRACK)
    audio.loop = true
    audio.volume = 0.3
    audioRef.current = audio
    const start = () => {
      audio.play().catch(() => undefined)
    }
    start()
    window.addEventListener('pointerdown', start, { once: true })
    return () => window.removeEventListener('pointerdown', start)
  }, [enabled])

  useEffect(() => () => audioRef.current?.pause(), [])

  return null
}
```

Em `src/app/App.tsx`, importar `MusicPlayer` e renderizar `<MusicPlayer />` ao lado de `<PreferenceSync />`.

`public/audio/README.md`:
```md
# Trilhas sonoras

Coloque aqui `theme.ogg` (trilha ambiente em loop, 60–120 s). O jogo funciona sem o arquivo.

Geração sugerida (offline, fora do app) com ACE-Step 1.5 — veja `docs/audio.md`.
```

- [ ] **Step 7: Implementar `src/features/how-to-play/HowToPlayPage.tsx` e CSS**

```tsx
import { Link } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { PageHeader } from '@/components/layout/PageHeader'
import './HowToPlayPage.css'

const LOOP = [
  'Receba uma missão agrícola e leia o objetivo.',
  'Observe o mapa e os recursos disponíveis.',
  'Monte um algoritmo encaixando blocos dentro de "quando executar".',
  'Clique em Executar e observe o robô seguir cada bloco.',
  'Leia o console: ele explica o que aconteceu e por quê.',
  'Corrija o algoritmo e tente de novo até cumprir a missão.',
]

export function HowToPlayPage() {
  return (
    <div className="chrome-page">
      <PageHeader title="Como jogar" subtitle="Você não controla o robô diretamente: você escreve o programa que ele segue." backTo="/" />
      <main className="how-to-play">
        <section className="card">
          <h2>O ciclo do jogo</h2>
          <ol className="how-to-play__loop">
            {LOOP.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <Link className="button button--primary" to="/jogar/m0-training">
            Fazer o treinamento interativo
          </Link>
        </section>
        <section className="card">
          <h2>Blocos</h2>
          <ul>
            <li><strong>Movimento</strong>: andar e virar. Mover gasta energia; virar não.</li>
            <li><strong>Agricultura</strong>: preparar solo, plantar, regar, colher e coletar recursos.</li>
            <li><strong>Sensores</strong>: perguntas de sim ou não sobre o canteiro e o caminho.</li>
            <li><strong>Controle</strong>: repetir, enquanto, se / senão e operadores lógicos.</li>
            <li><strong>Variáveis</strong> e <strong>Procedimentos</strong>: liberados nas fases finais.</li>
          </ul>
          <p>Para remover um bloco, arraste-o para a biblioteca ou para a lixeira. Passe o mouse sobre um bloco para ler a explicação.</p>
        </section>
        <section className="card">
          <h2>Executando</h2>
          <ul>
            <li><Icon name="play" size={16} /> <strong>Executar</strong>: roda o programa no ritmo escolhido.</li>
            <li><Icon name="pause" size={16} /> <strong>Pausar / Continuar</strong>: congela e retoma a execução.</li>
            <li><Icon name="step" size={16} /> <strong>Passo a passo</strong>: cada clique executa uma instrução, inclusive as perguntas dos sensores.</li>
            <li><Icon name="stop" size={16} /> <strong>Parar</strong> e <Icon name="reset" size={16} /> <strong>Reiniciar</strong>: a fazenda volta ao estado inicial.</li>
          </ul>
          <p>Atalhos: Ctrl + Enter executa, Espaço pausa ou continua, ponto executa um passo e Esc para.</p>
        </section>
        <section className="card">
          <h2>Dicas e resultados</h2>
          <p>As dicas vão da ideia geral até um exemplo parcial. O objetivo é aprender a construir e compreender algoritmos, e não apenas completar fases rapidamente.</p>
          <p>Uma solução correta sempre conclui a fase. A eficiência (comandos, blocos e recursos) é mostrada à parte, para você comparar e melhorar.</p>
        </section>
        <section className="card">
          <h2>Telas pequenas</h2>
          <p>A programação com blocos funciona melhor em computadores e tablets (a partir de 768 px). No celular é possível navegar, ver o mapa e executar programas já montados.</p>
        </section>
      </main>
    </div>
  )
}
```

`src/features/how-to-play/HowToPlayPage.css`:
```css
.how-to-play {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
  padding: 0 var(--space-5) var(--space-6);
}

.how-to-play h2 {
  font-size: var(--text-lg);
}

.how-to-play__loop {
  display: grid;
  gap: var(--space-2);
  padding-left: var(--space-5);
}

.how-to-play li {
  margin-bottom: var(--space-2);
}
```

Registrar em `src/app/routes.tsx`: `import { HowToPlayPage } from '@/features/how-to-play/HowToPlayPage'` e `{ path: '/como-jogar', element: <HowToPlayPage /> },`.

- [ ] **Step 8: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: PASS em toda a suíte.

- [ ] **Step 9: Verificação manual**

Run: `npm run dev`. Conferir contra a imagem de referência: início (cena 3D, botões à esquerda), `#/missoes` (mapa com nós e cartão lateral), concluir a Fase 1 e ver `#/resultado/m1-first-harvest` (celebração, estatísticas, "Ver solução" abre "Como funciona?"), `#/como-jogar`. Ligar/desligar efeitos sonoros nas configurações.

- [ ] **Step 10: Commit**

```bash
git add src public/audio
git commit -m "feat(ui): add how-to-play page, synthesized sound effects and optional music"
```
