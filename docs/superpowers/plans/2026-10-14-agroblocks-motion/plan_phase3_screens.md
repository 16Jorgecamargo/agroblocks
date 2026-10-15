# AgroBlocks Motion — Fase 3: Transições de tela e telas animadas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rotas com `AnimatePresence` (blur crossfade, iris ao entrar em fase, push ao voltar), tela inicial em cascata com folha balançando, mapa de missões com onda, pulso e desbloqueio animado, resultado com estrelas de mola, contagem, confete e conquista, avaliação com troca empurrada.

**Architecture:** Regras de qual transição usar e quais fases foram desbloqueadas são funções puras testadas. Componentes reutilizáveis de celebração (`StarRow`, `CountUp`, `Confetti`) ficam em `src/components/game/`. Tudo usa `src/motion/`.

**Tech Stack:** `motion/react`, `motion` (`animate`), React Router, Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-motion-assets-design.md` (seção 3)

Leia `plan_index.md` antes de começar.

---

### Task 3.1: Rotas animadas

**Files:**
- Create: `src/app/routeTransitions.ts`, `src/app/AnimatedRoutes.tsx`
- Modify: `src/app/App.tsx`, `src/styles/global.css`
- Test: `src/app/routeTransitions.test.ts`

**Interfaces:**
- Consumes: `appRoutes`, `pageVariants`, `PageTransitionKind`.
- Produces: `transitionFor(from: string, to: string): PageTransitionKind`, `AnimatedRoutes()`.

- [ ] **Step 1: Escrever teste que falha `src/app/routeTransitions.test.ts`**

```ts
import { transitionFor } from '@/app/routeTransitions'

describe('transitionFor', () => {
  it('opens a mission from the map with an iris', () => {
    expect(transitionFor('/missoes', '/jogar/m1-first-harvest')).toBe('iris')
  })

  it('pushes back from a mission to the map', () => {
    expect(transitionFor('/jogar/m1-first-harvest', '/missoes')).toBe('push')
  })

  it('uses a blur crossfade everywhere else', () => {
    expect(transitionFor('/', '/missoes')).toBe('blurCrossfade')
    expect(transitionFor('/jogar/m1-first-harvest', '/resultado/m1-first-harvest')).toBe('blurCrossfade')
    expect(transitionFor('/', '/')).toBe('blurCrossfade')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/app/routeTransitions.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `src/app/routeTransitions.ts`**

```ts
import type { PageTransitionKind } from '@/motion/presets'

export function transitionFor(from: string, to: string): PageTransitionKind {
  if (from === '/missoes' && to.startsWith('/jogar/')) return 'iris'
  if (from.startsWith('/jogar/') && to === '/missoes') return 'push'
  return 'blurCrossfade'
}
```

- [ ] **Step 4: Implementar `src/app/AnimatedRoutes.tsx`**

```tsx
import { useEffect, useMemo, useRef } from 'react'
import { useLocation, useRoutes } from 'react-router'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { appRoutes } from '@/app/routes'
import { transitionFor } from '@/app/routeTransitions'
import { pageVariants, type PageTransitionKind } from '@/motion/presets'

const routeVariants: Variants = {
  initial: (kind: PageTransitionKind) => pageVariants[kind].initial as object,
  animate: (kind: PageTransitionKind) => pageVariants[kind].animate as object,
  exit: (kind: PageTransitionKind) => pageVariants[kind].exit as object,
}

export function AnimatedRoutes() {
  const location = useLocation()
  const element = useRoutes(appRoutes, location)
  const previous = useRef(location.pathname)
  const kind = useMemo(() => transitionFor(previous.current, location.pathname), [location.pathname])

  useEffect(() => {
    previous.current = location.pathname
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait" initial={false} custom={kind}>
      <motion.div key={location.pathname} className="page-transition" custom={kind} variants={routeVariants} initial="initial" animate="animate" exit="exit">
        {element}
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 5: Usar em `src/app/App.tsx`**

Remover a função `AppRoutes` e o import de `useRoutes`/`appRoutes`; importar `AnimatedRoutes` de `@/app/AnimatedRoutes` e trocar `<AppRoutes />` por `<AnimatedRoutes />`.

Em `src/styles/global.css`, acrescentar:
```css
.page-transition {
  min-height: 100vh;
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npx vitest run src/app && npm run typecheck`
Expected: PASS (inclui o teste antigo de `App`).

- [ ] **Step 7: Commit**

```bash
git add src/app src/styles/global.css
git commit -m "feat(motion): animate route changes with blur crossfade, iris and push"
```

---

### Task 3.2: Componentes de celebração (`StarRow`, `CountUp`, `Confetti`)

**Files:**
- Create: `src/components/game/StarRow.tsx`, `src/components/game/CountUp.tsx`, `src/components/game/Confetti.tsx`, `src/components/game/celebration.css`
- Modify: `src/main.tsx` (importar `celebration.css`)
- Test: `src/components/game/celebration.test.tsx`

**Interfaces:**
- Consumes: `SPRINGS`, `DURATIONS`, `EASINGS`, `useMotionPrefs`, `createRandom`, `hashString`, `Icon`.
- Produces:
  - `StarRow({ value, label, size?, delay? })` — `role="img"` com `aria-label={label}`; estrelas acesas entram uma a uma com mola `star`
  - `CountUp({ value })` — mostra o número contando de 0 até `value` (easeOutExpo, 2s); com movimento reduzido mostra direto o valor final; texto acessível sempre com o valor final
  - `Confetti({ pieces?, seed? })` — não renderiza nada com movimento reduzido

- [ ] **Step 1: Escrever teste que falha `src/components/game/celebration.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { Confetti } from '@/components/game/Confetti'
import { CountUp } from '@/components/game/CountUp'
import { StarRow } from '@/components/game/StarRow'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

describe('celebration components', () => {
  it('labels the star row and renders three stars', () => {
    const { container } = render(<StarRow value={2} label="Eficiência 2 de 3" />)
    expect(screen.getByRole('img', { name: 'Eficiência 2 de 3' })).toBeInTheDocument()
    expect(container.querySelectorAll('.star-row__star')).toHaveLength(3)
    expect(container.querySelectorAll('.star-row__star.is-on')).toHaveLength(2)
  })

  it('shows the final number immediately when motion is reduced', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'reduced' } })
    const { container } = render(<CountUp value={12} />)
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('12')
    expect(container).toHaveTextContent('12')
  })

  it('counts up to the final number', async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full' } })
    const { container } = render(<CountUp value={7} />)
    expect(container.querySelector('.visually-hidden')).toHaveTextContent('7')
    await screen.findByText('7', { selector: '[aria-hidden="true"]' }, { timeout: 3500 })
  })

  it('renders confetti only when decorative motion is allowed', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full' } })
    const { container, unmount } = render(<Confetti pieces={20} />)
    expect(container.querySelectorAll('.confetti__piece')).toHaveLength(20)
    unmount()
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'reduced' } })
    const reduced = render(<Confetti pieces={20} />)
    expect(reduced.container.querySelectorAll('.confetti__piece')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/game/celebration.test.tsx`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/components/game/StarRow.tsx`**

```tsx
import { motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import { SPRINGS } from '@/motion/springs'

interface StarRowProps {
  value: number
  label: string
  size?: number
  delay?: number
}

export function StarRow({ value, label, size = 20, delay = 0.3 }: StarRowProps) {
  return (
    <span className="star-row" role="img" aria-label={label}>
      {[1, 2, 3].map((position) => {
        const on = position <= value
        return (
          <motion.span
            key={position}
            aria-hidden="true"
            className={`star-row__star${on ? ' is-on' : ''}`}
            initial={{ scale: 0, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: on ? 1 : 0.35 }}
            transition={{ ...SPRINGS.star, delay: delay + position * 0.25 }}
          >
            <Icon name="star" size={size} />
          </motion.span>
        )
      })}
    </span>
  )
}
```

- [ ] **Step 4: Implementar `src/components/game/CountUp.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { animate } from 'motion'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

export function CountUp({ value }: { value: number }) {
  const { reduced } = useMotionPrefs()
  const [display, setDisplay] = useState(reduced ? value : 0)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: DURATIONS.countUp,
      ease: EASINGS.easeOutExpo,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [value, reduced])

  return (
    <span className="count-up">
      <span className="visually-hidden">{value}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  )
}
```

- [ ] **Step 5: Implementar `src/components/game/Confetti.tsx`**

```tsx
import { useMemo } from 'react'
import { motion } from 'motion/react'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { createRandom, hashString } from '@/render/seededRandom'

const COLORS = ['#e2533b', '#f2c14e', '#4185d6', '#3fa34d', '#e0508f', '#8e5be8']

export function Confetti({ pieces = 60, seed = 'confetti' }: { pieces?: number; seed?: string }) {
  const { decorative } = useMotionPrefs()
  const items = useMemo(() => {
    const random = createRandom(hashString(seed))
    return Array.from({ length: pieces }, (_, index) => ({
      id: index,
      left: random() * 100,
      color: COLORS[index % COLORS.length],
      width: 6 + random() * 6,
      height: 10 + random() * 8,
      spin: (random() > 0.5 ? 1 : -1) * (360 + random() * 540),
      drift: (random() - 0.5) * 120,
      delay: random() * 0.8,
      duration: DURATIONS.confetti * (0.7 + random() * 0.6),
    }))
  }, [pieces, seed])

  if (!decorative) return null
  return (
    <div className="confetti" aria-hidden="true">
      {items.map((item) => (
        <motion.span
          key={item.id}
          className="confetti__piece"
          style={{ left: `${item.left}%`, width: item.width, height: item.height, background: item.color }}
          initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', x: item.drift, rotate: item.spin, opacity: [1, 1, 0] }}
          transition={{ duration: item.duration, delay: item.delay, ease: 'linear' }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Criar `src/components/game/celebration.css` e importar em `src/main.tsx`**

```css
.star-row {
  display: inline-flex;
  gap: 2px;
  vertical-align: middle;
}

.star-row__star {
  display: inline-grid;
  color: #c9d0cc;
}

.star-row__star.is-on {
  color: var(--sun-400);
  filter: drop-shadow(0 2px 0 #c98b12);
}

.count-up {
  font-variant-numeric: tabular-nums;
}

.confetti {
  position: fixed;
  inset: 0;
  z-index: 90;
  overflow: hidden;
  pointer-events: none;
}

.confetti__piece {
  position: absolute;
  top: 0;
  border-radius: 2px;
}
```

Em `src/main.tsx`: `import '@/components/game/celebration.css'` após `game.css`.

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/components/game && npm run typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/game src/main.tsx
git commit -m "feat(motion): add spring star row, count-up and confetti celebration components"
```

---

### Task 3.3: Tela inicial e mapa de missões animados

**Files:**
- Create: `src/features/mission-select/unlocks.ts`, `src/services/storage/seenUnlocks.ts`
- Modify (substituir): `src/features/home/HomePage.tsx`, `src/components/brand/Logo.tsx`, `src/features/mission-select/MissionSelectPage.tsx`, `src/features/mission-select/MissionDetailCard.tsx`
- Modify: `src/features/mission-select/MissionMapScene.tsx`, `src/features/mission-select/MissionSelectPage.css`, `src/motion/presets.ts`
- Test: `src/features/mission-select/unlocks.test.ts`

**Interfaces:**
- Consumes: Fase 1–2, `StarRow`, `GameButton`, `SaveData`, `readJson`, `writeJson`, `safeStorage`.
- Produces:
  - `newlyUnlocked(save: SaveData, missionIds: string[], seen: string[]): string[]` — ids hoje disponíveis ou concluídos que não estão em `seen`, excluindo os que estavam disponíveis desde o início (`order <= 1`)
  - `SEEN_UNLOCKS_KEY = 'agroblocks:seen-unlocks:v1'`, `loadSeenUnlocks(storage): string[]`, `saveSeenUnlocks(storage, ids: string[]): void`
  - `cardFlip: Variants` em `presets.ts`
  - `Logo({ size?, animated? })`
  - `MissionMapScene` ganha props `ambient: boolean` e `celebrateIds: string[]`

- [ ] **Step 1: Escrever teste que falha `src/features/mission-select/unlocks.test.ts`**

```ts
import { newlyUnlocked } from '@/features/mission-select/unlocks'
import { loadSeenUnlocks, saveSeenUnlocks } from '@/services/storage/seenUnlocks'
import { MISSIONS } from '@/data/missions'
import { createInitialSave, recordAttempt } from '@/game/progress/progression'

const refs = MISSIONS.map(({ id, order }) => ({ id, order }))
const ids = MISSIONS.map((mission) => mission.id)

function completed(missionId: string) {
  return recordAttempt(
    createInitialSave(refs, 'now'),
    {
      missionId,
      timestamp: 'now',
      outcome: 'success',
      errorCode: null,
      actions: 1,
      blocks: 1,
      usage: { seeds: 0, water: 0, energy: 0 },
      efficiencyStars: 3,
      pseudocode: '',
    },
    refs,
  )
}

describe('unlocks', () => {
  it('ignores missions available from the start', () => {
    expect(newlyUnlocked(createInitialSave(refs, 'now'), ids, [])).toEqual([])
  })

  it('reports a mission unlocked since the last visit', () => {
    expect(newlyUnlocked(completed('m1-first-harvest'), ids, [])).toEqual(['m2-row-planting'])
  })

  it('does not repeat missions already celebrated', () => {
    expect(newlyUnlocked(completed('m1-first-harvest'), ids, ['m2-row-planting'])).toEqual([])
  })

  it('persists seen unlocks', () => {
    saveSeenUnlocks(window.localStorage, ['m2-row-planting'])
    expect(loadSeenUnlocks(window.localStorage)).toEqual(['m2-row-planting'])
    window.localStorage.setItem('agroblocks:seen-unlocks:v1', '{bad')
    expect(loadSeenUnlocks(window.localStorage)).toEqual([])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/features/mission-select/unlocks.test.ts`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/features/mission-select/unlocks.ts` e `src/services/storage/seenUnlocks.ts`**

```ts
import { MISSIONS } from '@/data/missions'
import type { SaveData } from '@/game/progress/types'

export function newlyUnlocked(save: SaveData, missionIds: string[], seen: string[]): string[] {
  const seenSet = new Set(seen)
  return missionIds.filter((id) => {
    const mission = MISSIONS.find((candidate) => candidate.id === id)
    const status = save.missions[id]?.status
    if (!mission || mission.order <= 1) return false
    return (status === 'available' || status === 'completed') && !seenSet.has(id)
  })
}
```

```ts
import { z } from 'zod'
import { readJson, writeJson } from '@/services/storage/jsonStorage'

export const SEEN_UNLOCKS_KEY = 'agroblocks:seen-unlocks:v1'

const schema = z.array(z.string())

export function loadSeenUnlocks(storage: Storage | null): string[] {
  return readJson(storage, SEEN_UNLOCKS_KEY, schema).value ?? []
}

export function saveSeenUnlocks(storage: Storage | null, ids: string[]): void {
  writeJson(storage, SEEN_UNLOCKS_KEY, ids)
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/features/mission-select/unlocks.test.ts`
Expected: PASS.

- [ ] **Step 5: Acrescentar `cardFlip` em `src/motion/presets.ts`**

```ts
export const cardFlip: Variants = {
  hidden: { opacity: 0, rotateY: -80 },
  visible: { opacity: 1, rotateY: 0, transition: { duration: 0.45, ease: EASINGS.easeOutCubic } },
  exit: { opacity: 0, rotateY: 80, transition: { duration: 0.25, ease: EASINGS.easeInCubic } },
}
```

- [ ] **Step 6: Substituir `src/components/brand/Logo.tsx`**

```tsx
import { motion } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import './Logo.css'

export function Logo({ size = 'sm', animated = false }: { size?: 'sm' | 'lg'; animated?: boolean }) {
  return (
    <span className={`logo logo--${size}`}>
      <motion.svg
        className="logo__leaf"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        style={{ originX: 0.1, originY: 0.9 }}
        animate={animated ? { rotate: [-6, 6, -6] } : { rotate: 0 }}
        transition={animated ? { duration: 3, ease: EASINGS.easeInOutSine, repeat: Infinity } : { duration: 0 }}
      >
        <path d="M4 20C4 10 10 4 21 3c0 11-6 17-17 17z" fill="#5cbf4f" />
        <path d="M4 20L15 9" stroke="#1f5a2c" strokeWidth="1.6" fill="none" />
      </motion.svg>
      <span className="logo__text">AgroBlocks</span>
    </span>
  )
}
```

- [ ] **Step 7: Substituir `src/features/home/HomePage.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { GameButton, GameLink } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { Icon } from '@/components/icons/Icon'
import { Logo } from '@/components/brand/Logo'
import { getMission, MISSIONS } from '@/data/missions'
import { HomeScene } from '@/features/home/HomeScene'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { continueMissionId, hasProgress } from '@/game/progress/progression'
import { EASINGS } from '@/motion/easings'
import { PRESSABLE, softRise, staggerContainer, staggerItem } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { useProgressStore } from '@/stores/progressStore'
import './HomePage.css'

const TRAINING_ID = 'm0-training'

export function HomePage() {
  const navigate = useNavigate()
  const { ambient } = useMotionPrefs()
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
      <motion.main className="home__panel" variants={staggerContainer(0.09, 0.15)} initial="hidden" animate="visible">
        <motion.h1 className="home__brand" variants={softRise}>
          <Logo size="lg" animated={ambient} />
        </motion.h1>
        <motion.p className="home__tagline" variants={staggerItem}>
          Automatize. Programe. Cultive.
        </motion.p>
        <motion.p className="home__intro" variants={staggerItem}>
          Construa algoritmos, controle robôs e transforme sua fazenda em um sistema inteligente.
        </motion.p>
        <motion.div className="home__actions" variants={staggerItem}>
          <motion.button type="button" className="home__cta home__cta--primary" onClick={startNew} {...PRESSABLE}>
            <Icon name="play" size={22} />
            Iniciar nova fazenda
          </motion.button>
          <motion.button
            type="button"
            className="home__cta home__cta--dark"
            disabled={!continueMission}
            onClick={() => continueMission && navigate(`/jogar/${continueMission.id}`)}
            {...(continueMission ? PRESSABLE : {})}
          >
            <Icon name="chart" size={22} />
            <span className="home__cta-text">
              Continuar missão
              {continueMission && (
                <small>{continueMission.tutorial ? continueMission.title : `Fase ${continueMission.order} - ${continueMission.title}`}</small>
              )}
            </span>
          </motion.button>
        </motion.div>
        <motion.div className="home__progress" variants={staggerItem}>
          <span>
            {completed} de {phases.length} fases concluídas
          </span>
          <span className="home__progress-track" role="progressbar" aria-label="Progresso nas fases" aria-valuemin={0} aria-valuemax={phases.length} aria-valuenow={completed}>
            <motion.span
              className="home__progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(completed / phases.length) * 100}%` }}
              transition={{ duration: 1.2, ease: EASINGS.easeOutCubic, delay: 0.6 }}
            />
          </span>
        </motion.div>
        <motion.nav className="home__links" aria-label="Mais opções" variants={staggerItem}>
          <GameLink to="/como-jogar" tone="ghost" icon="help">
            Como jogar
          </GameLink>
          <GameButton tone="ghost" icon="gear" onClick={() => setShowSettings(true)}>
            Configurações
          </GameButton>
          <GameLink to="/missoes" tone="ghost" icon="flag">
            Missões
          </GameLink>
          <GameLink to="/avaliacao/pre" tone="ghost" icon="book">
            Avaliação
          </GameLink>
          <GameLink to="/painel" tone="ghost" icon="chart">
            Painel do professor
          </GameLink>
        </motion.nav>
      </motion.main>
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
      <GameDialog open={confirmNew} title="Começar uma nova fazenda?" icon="trash" tone="danger" onClose={() => setConfirmNew(false)}>
        <DialogSection>
          <p>Isso apaga o progresso, as tentativas e as respostas de avaliação salvas neste navegador.</p>
        </DialogSection>
        <DialogSection className="game-dialog__actions">
          <GameButton tone="secondary" onClick={() => setConfirmNew(false)}>
            Cancelar
          </GameButton>
          <GameButton
            tone="danger"
            onClick={() => {
              resetProgress()
              navigate(`/jogar/${TRAINING_ID}`)
            }}
          >
            Apagar e começar
          </GameButton>
        </DialogSection>
      </GameDialog>
    </div>
  )
}
```

Em `src/features/home/HomePage.css`: remover as regras `.home__progress progress`, `.home__link` e `.home__confirm`, e acrescentar:
```css
.home__progress-track {
  display: block;
  height: 12px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.15);
  overflow: hidden;
}

.home__progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #5cbf4f, #f2c14e);
}

.home__links .game-button {
  color: var(--chrome-text);
  background: rgb(21 34 28 / 0.75);
}
```

O teste `HomePage.test.tsx` procurava o texto "0 de 6 fases concluídas" e botões "Iniciar nova fazenda"/"Continuar missão"/"Apagar e começar" — todos mantidos.

- [ ] **Step 8: Substituir `src/features/mission-select/MissionDetailCard.tsx`**

```tsx
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { GameButton } from '@/components/game/GameButton'
import { StarRow } from '@/components/game/StarRow'
import { Icon } from '@/components/icons/Icon'
import { objectiveCells } from '@/features/gameplay/gameplayLogic'
import { lockReason } from '@/features/mission-select/missionMapLayout'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import type { MissionProgress } from '@/game/progress/types'
import { createInitialState } from '@/game/world/createInitialState'
import { cardFlip } from '@/motion/presets'
import { Grid2D } from '@/render/grid2d/Grid2D'

const STATUS_TEXT = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' } as const

export function MissionDetailCard({ mission, progress }: { mission: MissionDefinition; progress: MissionProgress | undefined }) {
  const navigate = useNavigate()
  const status = progress?.status ?? 'locked'
  const title = mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`
  const best = progress?.bestResult
  return (
    <motion.section className="mission-detail card" aria-label={title} variants={cardFlip} initial="hidden" animate="visible" exit="exit">
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
        <StarRow value={mission.difficulty} label={`Dificuldade ${mission.difficulty} de 3`} size={18} delay={0.1} />
      </div>
      <p className={`mission-detail__status mission-detail__status--${status}`}>
        <Icon name={status === 'completed' ? 'check' : status === 'locked' ? 'lock' : 'play'} size={16} /> {STATUS_TEXT[status]}
        {progress && progress.attempts > 0 && ` · ${progress.attempts} tentativa(s)`}
      </p>
      <p className="mission-detail__best">
        {best ? (
          <>
            Melhor resultado: <StarRow value={best.efficiencyStars} label={`Eficiência ${best.efficiencyStars} de 3`} size={16} delay={0.2} /> · {best.actions}{' '}
            comandos · {best.blocks} blocos
          </>
        ) : (
          'Ainda sem resultado.'
        )}
      </p>
      {status === 'locked' && <p className="mission-detail__lock">{lockReason(mission.order)}</p>}
      <GameButton tone="primary" size="lg" icon="play" className="mission-detail__start" disabled={status === 'locked'} onClick={() => navigate(`/jogar/${mission.id}`)}>
        {status === 'completed' ? 'Jogar de novo' : 'Iniciar fase'}
      </GameButton>
    </motion.section>
  )
}
```

- [ ] **Step 9: Substituir `src/features/mission-select/MissionSelectPage.tsx`**

```tsx
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '@/components/icons/Icon'
import { PageHeader } from '@/components/layout/PageHeader'
import { MISSIONS } from '@/data/missions'
import { MissionDetailCard } from '@/features/mission-select/MissionDetailCard'
import { newlyUnlocked } from '@/features/mission-select/unlocks'
import { continueMissionId } from '@/game/progress/progression'
import type { MissionStatus } from '@/game/progress/types'
import { EASINGS } from '@/motion/easings'
import { gridWaveItem, PRESSABLE } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { hasWebGL } from '@/render/hasWebGL'
import { safeStorage } from '@/services/storage/jsonStorage'
import { loadSeenUnlocks, saveSeenUnlocks } from '@/services/storage/seenUnlocks'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import './MissionSelectPage.css'

const MissionMapScene = lazy(() => import('@/features/mission-select/MissionMapScene'))

const STATUS_TEXT: Record<MissionStatus, string> = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' }

function ListBadge({ status, order, celebrate }: { status: MissionStatus; order: number; celebrate: boolean }) {
  const [opened, setOpened] = useState(!celebrate)
  useEffect(() => {
    if (!celebrate) return
    const timer = window.setTimeout(() => setOpened(true), 900)
    return () => window.clearTimeout(timer)
  }, [celebrate])
  const content = status === 'locked' || !opened ? 'lock' : status === 'completed' ? 'check' : 'number'
  return (
    <span className="mission-list__badge" aria-hidden="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={content}
          initial={{ scale: 0, rotate: -90 }}
          animate={celebrate && content === 'lock' ? { scale: [1, 1.2, 1], rotate: [0, -15, 15, 0] } : { scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90, transition: { duration: 0.2 } }}
          transition={SPRINGS.jelly}
        >
          {content === 'lock' ? <Icon name="lock" size={16} /> : content === 'check' ? <Icon name="check" size={16} /> : order}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function MissionSelectPage() {
  const save = useProgressStore((store) => store.save)
  const { renderMode, lowGraphics } = useSettingsStore((store) => store.settings)
  const { ambient } = useMotionPrefs()
  const webgl = useMemo(() => hasWebGL(), [])
  const [selectedId, setSelectedId] = useState(() => continueMissionId(save, MISSIONS) ?? 'm0-training')
  const [celebrateIds] = useState(() => newlyUnlocked(save, MISSIONS.map((mission) => mission.id), loadSeenUnlocks(safeStorage())))
  const statuses = Object.fromEntries(MISSIONS.map((mission) => [mission.id, save.missions[mission.id]?.status ?? 'locked'])) as Record<string, MissionStatus>
  const selected = MISSIONS.find((mission) => mission.id === selectedId) ?? MISSIONS[0]
  const show3d = renderMode !== '2d' && webgl

  useEffect(() => {
    if (celebrateIds.length === 0) return
    saveSeenUnlocks(safeStorage(), [...loadSeenUnlocks(safeStorage()), ...celebrateIds])
  }, [celebrateIds])

  return (
    <div className="chrome-page mission-select">
      <PageHeader title="Seus desafios" subtitle="Complete as missões e aprenda novos conceitos de programação." backTo="/" />
      <div className={`mission-select__body${show3d ? '' : ' mission-select__body--flat'}`}>
        {show3d && (
          <div className="mission-select__map">
            <Suspense fallback={<div className="mission-select__loading">Carregando mapa…</div>}>
              <MissionMapScene
                missions={MISSIONS}
                statuses={statuses}
                selectedId={selected.id}
                onSelect={setSelectedId}
                lowGraphics={lowGraphics}
                ambient={ambient}
                celebrateIds={celebrateIds}
              />
            </Suspense>
          </div>
        )}
        <ol className="mission-list" aria-label="Lista de fases">
          {MISSIONS.map((mission, index) => {
            const status = statuses[mission.id]
            const name = mission.tutorial ? `Treinamento · ${STATUS_TEXT[status]}` : `Fase ${mission.order} · ${mission.title} · ${STATUS_TEXT[status]}`
            const available = status === 'available'
            return (
              <motion.li key={mission.id} custom={index} variants={gridWaveItem} initial="hidden" animate="visible">
                <motion.button
                  type="button"
                  className={`mission-list__item mission-list__item--${status}`}
                  aria-pressed={mission.id === selected.id}
                  aria-label={name}
                  onClick={() => setSelectedId(mission.id)}
                  {...PRESSABLE}
                  animate={available && ambient ? { boxShadow: ['0 0 0 0 rgba(65,133,214,0.6)', '0 0 0 8px rgba(65,133,214,0)'] } : undefined}
                  transition={available && ambient ? { duration: 1.6, repeat: Infinity, ease: EASINGS.easeOutCubic } : PRESSABLE.transition}
                >
                  <ListBadge status={status} order={mission.order} celebrate={celebrateIds.includes(mission.id)} />
                  <span className="mission-list__name">{mission.tutorial ? 'Treinamento' : mission.title}</span>
                </motion.button>
              </motion.li>
            )
          })}
        </ol>
        <div className="mission-select__detail">
          <AnimatePresence mode="wait" initial={false}>
            <MissionDetailCard key={selected.id} mission={selected} progress={save.missions[selected.id]} />
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
```

Em `src/features/mission-select/MissionSelectPage.css`: trocar o seletor `.mission-detail {` por `.mission-select__detail {` (mantendo `grid-row`/`grid-column`), acrescentar `.mission-select__detail { perspective: 1200px; }` e `.mission-detail { display: grid; align-content: start; gap: var(--space-2); }`; no media query `max-width: 900px` trocar `.mission-detail` por `.mission-select__detail`.

- [ ] **Step 10: Animar os rótulos do mapa em `src/features/mission-select/MissionMapScene.tsx`**

- Acrescentar ao import: `import { motion } from 'motion/react'`, `import { SPRINGS } from '@/motion/springs'`, `import { EASINGS } from '@/motion/easings'`.
- Acrescentar às props: `ambient: boolean` e `celebrateIds: string[]`, desestruturando ambos.
- Trocar o `<button ... className={`map-label ...`}>` dos rótulos por `<motion.button`, mantendo todos os atributos, e acrescentar:
```tsx
            initial={{ opacity: 0, scale: 0.6 }}
            animate={
              celebrateIds.includes(mission.id)
                ? { opacity: 1, scale: [0.6, 1.25, 1], rotate: [0, -6, 6, 0] }
                : status === 'available' && ambient
                  ? { opacity: 1, scale: [1, 1.08, 1] }
                  : { opacity: 1, scale: 1 }
            }
            transition={
              status === 'available' && ambient && !celebrateIds.includes(mission.id)
                ? { duration: 1.6, repeat: Infinity, ease: EASINGS.easeInOutSine, delay: mission.order * 0.07 }
                : { ...SPRINGS.marker, delay: mission.order * 0.07 }
            }
```
e fechar com `</motion.button>`.

Como o `transform` do rótulo é escrito a cada frame pelo `LabelProjector`, envolva o conteúdo do botão num `<motion.span className="map-label__inner">` e aplique `initial`/`animate`/`transition` nesse span em vez do botão (o botão continua `button` simples posicionado pelo projetor). Em `MissionSelectPage.css`, mover o visual de `.map-label` (padding, borda, fundo, cor, fonte, `display:inline-flex`, `gap`) para `.map-label__inner` e deixar `.map-label` só com `position:absolute; left:0; top:0; z-index:2; padding:0; border:none; background:transparent; cursor:pointer;`. As variações `.map-label--available`, `--locked`, `.is-selected` passam a mirar `.map-label--available .map-label__inner` etc.

- [ ] **Step 11: Rodar tudo**

Run: `npx vitest run && npm run typecheck`
Expected: PASS (`MissionSelectPage.test.tsx` e `HomePage.test.tsx` inalterados).

- [ ] **Step 12: Verificação visual**

`npm run dev`: `#/` (logo sobe com desfoque, botões entram em cascata, folha balança, barra de progresso enche); `#/missoes` (lista entra em onda, fase disponível pulsa, trocar de fase vira o cartão). Completar a Fase 1 e voltar ao mapa: a Fase 2 mostra cadeado tremendo e virando número.

- [ ] **Step 13: Commit**

```bash
git add src
git commit -m "feat(motion): animate home and mission map with cascade, pulses, card flip and unlock celebration"
```

---

### Task 3.4: Resultado e avaliação animados

**Files:**
- Modify (substituir): `src/features/results/ResultsPage.tsx`
- Modify: `src/features/results/ResultsPage.css`, `src/features/assessment/AssessmentPage.tsx`, `src/features/assessment/AssessmentPage.css`

**Interfaces:**
- Consumes: `StarRow`, `CountUp`, `Confetti`, `GameButton`, `GameLink`, `overshoot`, `staggerContainer`, `staggerItem`, `SPRINGS`, `pageVariants`, `BADGE_POP`.

- [ ] **Step 1: Substituir `src/features/results/ResultsPage.tsx`**

```tsx
import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Confetti } from '@/components/game/Confetti'
import { CountUp } from '@/components/game/CountUp'
import { GameButton, GameLink } from '@/components/game/GameButton'
import { StarRow } from '@/components/game/StarRow'
import { Icon } from '@/components/icons/Icon'
import { getMission } from '@/data/missions'
import { CONCEPT_TIPS, latestSuccess, nextStep, previousBestBefore, referenceStats } from '@/features/results/resultsLogic'
import { CONCEPT_LABELS } from '@/game/missions/missionTypes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASINGS } from '@/motion/easings'
import { overshoot, rowExpand, staggerContainer, staggerItem } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { hasWebGL } from '@/render/hasWebGL'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import './ResultsPage.css'

const CelebrationScene = lazy(() => import('@/features/results/CelebrationScene'))

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <motion.div className="result-stat" role="group" aria-label={label} variants={staggerItem}>
      <span className="result-stat__label" aria-hidden="true">
        {label}
      </span>
      <span className="result-stat__value">{children}</span>
    </motion.div>
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
  const stars = attempt.efficiencyStars ?? 1

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
      </div>
      <Confetti seed={mission.id} />

      <main className="results__content">
        <motion.section className="results__card card" aria-labelledby="results-title" variants={staggerContainer(0.08, 0.2)} initial="hidden" animate="visible">
          <div className="results__head">
            <motion.span
              className="results__star"
              aria-hidden="true"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...SPRINGS.star, delay: 0.1 }}
            >
              <Icon name="star" size={48} />
              <motion.span
                className="results__burst"
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 0.9, ease: EASINGS.easeOutCubic, delay: 0.25 }}
              />
            </motion.span>
            <div>
              <motion.h1 id="results-title" className="results__title" variants={overshoot}>
                Missão concluída!
              </motion.h1>
              <motion.p className="results__goal" variants={staggerItem}>
                {mission.briefing.goalText}
              </motion.p>
            </div>
          </div>

          <motion.div className="results__verdict" variants={staggerItem}>
            <span className="results__correct">
              <Icon name="check" /> Solução correta
            </span>
            <StarRow value={stars} label={`Eficiência ${stars} de 3`} size={26} delay={0.6} />
          </motion.div>
          <motion.p className="results__note" variants={staggerItem}>
            A eficiência é avaliada à parte: uma solução correta nunca é reprovada por usar mais comandos.
          </motion.p>

          <motion.div className="results__stats" variants={staggerContainer(0.07, 0.1)}>
            <Stat label="Comandos executados">
              <CountUp value={attempt.actions} />
            </Stat>
            <Stat label="Tentativas">
              <CountUp value={progress?.attempts ?? attempt.attemptNumber} />
            </Stat>
            <Stat label="Blocos usados">
              <CountUp value={attempt.blocks} />
            </Stat>
            <Stat label="Dicas usadas">
              <CountUp value={attempt.hintsUsed} />
            </Stat>
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
            <motion.div
              className="results__concept"
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ ...SPRINGS.achievement, delay: 1.2 }}
            >
              <Icon name="check" />
              <span>
                Conceito aprendido
                <strong>{CONCEPT_LABELS[mission.concept]}</strong>
              </span>
            </motion.div>
          </motion.div>

          {previous && (
            <motion.p className="results__compare" variants={staggerItem}>
              Comparado com sua melhor solução anterior: {previous.actions} → {attempt.actions} comandos, {previous.blocks} → {attempt.blocks} blocos.
            </motion.p>
          )}

          <motion.div className="results__actions" variants={staggerItem}>
            <GameButton tone="secondary" icon="book" aria-expanded={showSolution} onClick={() => setShowSolution((value) => !value)}>
              {showSolution ? 'Ocultar explicação' : 'Ver solução'}
            </GameButton>
            <GameLink to={`/jogar/${mission.id}`} tone="secondary" icon="reset">
              Tentar melhorar
            </GameLink>
            <GameLink to={next.to} tone="primary" size="lg">
              {next.label}
            </GameLink>
          </motion.div>
        </motion.section>

        <AnimatePresence>
          {showSolution && (
            <motion.section className="results__explain card" aria-labelledby="explain-title" variants={rowExpand} initial="hidden" animate="visible" exit="hidden">
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
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
```

Em `src/features/results/ResultsPage.css`: remover `.results__confetti`, `@keyframes confetti-fall` e o media query de `prefers-reduced-motion` que escondia o confete; acrescentar:
```css
.results__star {
  position: relative;
  display: inline-grid;
}

.results__burst {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 4px solid var(--sun-400);
}

.results__explain {
  overflow: hidden;
}
```

O teste `ResultsPage.test.tsx` continua válido: "Comandos executados" contém 12 (texto acessível do `CountUp`), estrelas com rótulo "Eficiência 1 de 3", links "Próxima fase" e "Tentar melhorar".

- [ ] **Step 2: Animar a troca de questões em `src/features/assessment/AssessmentPage.tsx`**

- Importar `import { AnimatePresence, motion } from 'motion/react'`, `import { pageVariants, BADGE_POP } from '@/motion/presets'` e `import { GameButton } from '@/components/game/GameButton'`.
- No ramo das questões, trocar `return (<section className="card assessment__card" aria-labelledby="question-prompt">` … `</section>)` por:
```tsx
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={item.id}
          className="card assessment__card"
          aria-labelledby="question-prompt"
          variants={pageVariants.push}
          initial="initial"
          animate="animate"
          exit="exit"
        >
```
mantendo todo o conteúdo interno, e fechando com `</motion.section></AnimatePresence>)`.
- Trocar cada `<label key={option} className={...}>` das alternativas por `<motion.label key={option} className={...} animate={selected === optionIndex ? BADGE_POP.keyframes : { scale: 1 }} transition={BADGE_POP.options}>` (fechando com `</motion.label>`).
- Trocar os botões "Anterior" e "Próxima/Concluir" por `GameButton` (`tone="secondary"` e `tone="primary"`), mantendo `disabled`, `onClick` e textos.

- [ ] **Step 3: Rodar tudo**

Run: `npx vitest run && npm run typecheck`
Expected: PASS (`ResultsPage.test.tsx` e `AssessmentPage.test.tsx` inalterados; se o teste de avaliação falhar por haver duas questões no DOM durante a saída, o `mode="wait"` garante uma por vez — confirme que o `key` é `item.id`).

- [ ] **Step 4: Verificação visual**

Concluir a Fase 1 no navegador: estrela gira e explode em anel, título com overshoot, estrelas de eficiência entram uma a uma, números contam, conceito desliza, confete cai. Abrir "Ver solução": painel expande. `#/avaliacao/pre`: questões entram empurradas, alternativa escolhida pulsa.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat(motion): animate results celebration and assessment question flow"
```
