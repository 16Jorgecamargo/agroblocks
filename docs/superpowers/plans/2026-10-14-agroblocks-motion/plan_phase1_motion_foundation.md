# AgroBlocks Motion — Fase 1: Fundação de movimento

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar Motion e criar `src/motion/` com molas, easings e presets nomeados conforme a referência, preferências de movimento e provider global.

**Architecture:** Toda animação do projeto passa a importar valores de `src/motion/`. `MotionProvider` envolve o app com `MotionConfig`. `useMotionPrefs` decide se efeitos decorativos e ambientes montam.

**Tech Stack:** `motion` 14 (`motion/react` + `motion`), React 19, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-14-agroblocks-motion-assets-design.md` (seção 2)

Leia `plan_index.md` antes de começar.

---

### Task 1.1: Molas, easings e presets

**Files:**
- Create: `src/motion/springs.ts`, `src/motion/easings.ts`, `src/motion/presets.ts`
- Test: `src/motion/presets.test.ts`

**Interfaces:**
- Produces:
  - `interface SpringSpec { type: 'spring'; stiffness: number; damping: number; mass: number }`
  - `SPRINGS: Record<SpringName, SpringSpec>` com `snap, bounce, smooth, modal, sheet, pill, push3d, star, marker, achievement, toast, cameraKick, jelly`
  - `scaleSpring(spring: SpringSpec, speed: number): SpringSpec`
  - `type CubicBezier = [number, number, number, number]`, `EASINGS` com `easeOutCubic, easeInOutCubic, easeOutBack, easeOutExpo, easeInCubic, easeInOutSine, easeOutQuart, easeInBack, easeOutSine, easeInQuad`
  - `DURATIONS` (segundos) e variants: `fadeSlide, softRise, snapIn, overshoot, questBanner, staggerItem, gridWaveItem, rowExpand, toastItem, dialogBackdrop, dialogSheet, pageVariants`
  - `staggerContainer(stagger?: number, delay?: number): Variants`
  - Alvos de animação imperativa: `ERROR_SHAKE`, `NUDGE`, `BADGE_POP`, `FOCUS_HALO`, `HEARTBEAT`
  - `PRESSABLE` (props `whileHover`/`whileTap`/`transition` para qualquer `motion.*`)
  - `type PageTransitionKind = 'blurCrossfade' | 'iris' | 'push'`

- [ ] **Step 1: Instalar Motion**

```bash
npm install motion
```
Expected: `motion` 14.x em `dependencies`.

- [ ] **Step 2: Escrever teste que falha `src/motion/presets.test.ts`**

```ts
import { EASINGS } from '@/motion/easings'
import { SPRINGS, scaleSpring } from '@/motion/springs'
import {
  BADGE_POP,
  DURATIONS,
  ERROR_SHAKE,
  dialogSheet,
  fadeSlide,
  pageVariants,
  staggerContainer,
} from '@/motion/presets'

describe('motion presets', () => {
  it('uses the reference spring values', () => {
    expect(SPRINGS.sheet).toEqual({ type: 'spring', stiffness: 260, damping: 20, mass: 1 })
    expect(SPRINGS.snap).toEqual({ type: 'spring', stiffness: 180, damping: 13, mass: 0.6 })
    expect(SPRINGS.star).toEqual({ type: 'spring', stiffness: 400, damping: 14, mass: 1 })
    expect(SPRINGS.jelly.damping).toBe(6.8)
  })

  it('uses the reference durations in seconds', () => {
    expect(DURATIONS).toMatchObject({
      fadeSlide: 0.6,
      softRise: 0.9,
      snapIn: 0.38,
      shrinkFadeExit: 0.52,
      staggerList: 0.76,
      gridWave: 0.9,
      errorShake: 0.54,
      nudge: 0.52,
      blurCrossfade: 0.6,
      iris: 0.6,
      push: 0.4,
      odometer: 0.75,
      countUp: 2,
      rowExpand: 0.72,
    })
  })

  it('builds fade + slide with easeOutCubic', () => {
    expect(fadeSlide.visible).toMatchObject({ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASINGS.easeOutCubic } })
  })

  it('animates dialogs with the sheet spring and exits with shrink fade', () => {
    expect(dialogSheet.visible).toMatchObject({ opacity: 1, y: 0, scale: 1, transition: SPRINGS.sheet })
    expect(dialogSheet.exit).toMatchObject({ opacity: 0, scale: 0.9, transition: { duration: 0.52 } })
  })

  it('provides one page variant per transition kind', () => {
    expect(Object.keys(pageVariants).sort()).toEqual(['blurCrossfade', 'iris', 'push'])
    expect(pageVariants.iris.animate).toMatchObject({ clipPath: 'circle(150% at 50% 50%)' })
  })

  it('staggers children', () => {
    expect(staggerContainer(0.08, 0.2).visible).toEqual({ transition: { staggerChildren: 0.08, delayChildren: 0.2 } })
  })

  it('defines shake and pop keyframes', () => {
    expect(ERROR_SHAKE.keyframes.x.at(-1)).toBe(0)
    expect(ERROR_SHAKE.options.duration).toBe(0.54)
    expect(BADGE_POP.keyframes.scale).toEqual([1, 1.35, 0.95, 1])
  })

  it('scales springs with the execution speed', () => {
    expect(scaleSpring(SPRINGS.smooth, 2)).toEqual({ type: 'spring', stiffness: 480, damping: 52, mass: 1 })
    expect(scaleSpring(SPRINGS.smooth, 1)).toEqual(SPRINGS.smooth)
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/motion`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 4: Criar `src/motion/springs.ts`**

```ts
export interface SpringSpec {
  type: 'spring'
  stiffness: number
  damping: number
  mass: number
}

function spring(stiffness: number, damping: number, mass = 1): SpringSpec {
  return { type: 'spring', stiffness, damping, mass }
}

export const SPRINGS = {
  snap: spring(180, 13, 0.6),
  bounce: spring(150, 9, 0.8),
  smooth: spring(120, 26),
  modal: spring(280, 28),
  sheet: spring(260, 20),
  pill: spring(240, 24),
  push3d: spring(420, 24),
  star: spring(400, 14),
  marker: spring(150, 15),
  achievement: spring(240, 22),
  toast: spring(300, 24),
  cameraKick: spring(220, 18),
  jelly: spring(290, 6.8),
} as const

export type SpringName = keyof typeof SPRINGS

export function scaleSpring(base: SpringSpec, speed: number): SpringSpec {
  return { ...base, stiffness: base.stiffness * speed * speed, damping: base.damping * speed }
}
```

- [ ] **Step 5: Criar `src/motion/easings.ts`**

```ts
export type CubicBezier = [number, number, number, number]

export const EASINGS = {
  easeOutCubic: [0.33, 1, 0.68, 1],
  easeInOutCubic: [0.65, 0, 0.35, 1],
  easeOutBack: [0.34, 1.56, 0.64, 1],
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeInCubic: [0.32, 0, 0.67, 0],
  easeInOutSine: [0.37, 0, 0.63, 1],
  easeOutQuart: [0.25, 1, 0.5, 1],
  easeInBack: [0.36, 0, 0.66, -0.56],
  easeOutSine: [0.61, 1, 0.88, 1],
  easeInQuad: [0.11, 0, 0.5, 0],
} satisfies Record<string, CubicBezier>
```

- [ ] **Step 6: Criar `src/motion/presets.ts`**

```ts
import type { Variants } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import { SPRINGS } from '@/motion/springs'

export const DURATIONS = {
  fadeSlide: 0.6,
  softRise: 0.9,
  snapIn: 0.38,
  shrinkFadeExit: 0.52,
  staggerList: 0.76,
  gridWave: 0.9,
  overshoot: 0.6,
  questBanner: 0.8,
  errorShake: 0.54,
  nudge: 0.52,
  badgePop: 0.45,
  focusHalo: 0.9,
  blurCrossfade: 0.6,
  iris: 0.6,
  push: 0.4,
  odometer: 0.75,
  countUp: 2,
  rowExpand: 0.72,
  harvestFlight: 0.9,
  confetti: 2.8,
} as const

export const fadeSlide: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATIONS.fadeSlide, ease: EASINGS.easeOutCubic } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: EASINGS.easeInCubic } },
}

export const softRise: Variants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: DURATIONS.softRise, ease: EASINGS.easeOutSine } },
}

export const snapIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATIONS.snapIn, ease: EASINGS.easeOutExpo } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: EASINGS.easeInCubic } },
}

export const overshoot: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURATIONS.overshoot, ease: EASINGS.easeOutBack } },
}

export const questBanner: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
  visible: {
    opacity: 1,
    clipPath: 'inset(0 0% 0 0)',
    transition: { duration: DURATIONS.questBanner, ease: EASINGS.easeOutExpo },
  },
}

export function staggerContainer(stagger = 0.06, delay = 0): Variants {
  return { hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATIONS.staggerList, ease: EASINGS.easeOutCubic } },
}

export const gridWaveItem: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATIONS.gridWave, ease: EASINGS.easeOutCubic, delay: index * 0.07 },
  }),
}

export const rowExpand: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: DURATIONS.rowExpand, ease: EASINGS.easeOutBack } },
}

export const toastItem: Variants = {
  hidden: { opacity: 0, x: -16, scale: 0.96 },
  visible: { opacity: 1, x: 0, scale: 1, transition: SPRINGS.toast },
}

export const dialogBackdrop: Variants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { opacity: 1, backdropFilter: 'blur(4px)', transition: { duration: 0.3, ease: EASINGS.easeOutCubic } },
  exit: { opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.3, ease: EASINGS.easeInCubic } },
}

export const dialogSheet: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1, transition: SPRINGS.sheet },
  exit: { opacity: 0, scale: 0.9, transition: { duration: DURATIONS.shrinkFadeExit, ease: EASINGS.easeInCubic } },
}

export type PageTransitionKind = 'blurCrossfade' | 'iris' | 'push'

export const pageVariants: Record<PageTransitionKind, Variants> = {
  blurCrossfade: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)', transition: { duration: DURATIONS.blurCrossfade, ease: EASINGS.easeInOutSine } },
    exit: { opacity: 0, filter: 'blur(10px)', transition: { duration: 0.3, ease: EASINGS.easeInOutSine } },
  },
  iris: {
    initial: { clipPath: 'circle(0% at 50% 50%)' },
    animate: { clipPath: 'circle(150% at 50% 50%)', transition: { duration: DURATIONS.iris, ease: EASINGS.easeInCubic } },
    exit: { opacity: 0, transition: { duration: 0.25 } },
  },
  push: {
    initial: { opacity: 0, x: -60 },
    animate: { opacity: 1, x: 0, transition: { duration: DURATIONS.push, ease: EASINGS.easeInOutCubic } },
    exit: { opacity: 0, x: 60, transition: { duration: 0.25, ease: EASINGS.easeInOutCubic } },
  },
}

export const ERROR_SHAKE = {
  keyframes: { x: [0, -10, 10, -7, 7, -3, 3, 0] },
  options: { duration: DURATIONS.errorShake, ease: EASINGS.easeOutExpo },
}

export const NUDGE = {
  keyframes: { x: [0, 6, 0, 4, 0] },
  options: { duration: DURATIONS.nudge, ease: EASINGS.easeOutBack },
}

export const BADGE_POP = {
  keyframes: { scale: [1, 1.35, 0.95, 1] },
  options: { duration: DURATIONS.badgePop, ease: EASINGS.easeOutBack },
}

export const FOCUS_HALO = {
  keyframes: {
    filter: [
      'drop-shadow(0 0 0px rgba(242,193,78,0.9))',
      'drop-shadow(0 0 10px rgba(242,193,78,0.9))',
      'drop-shadow(0 0 0px rgba(242,193,78,0.9))',
    ],
  },
  options: { duration: DURATIONS.focusHalo, ease: EASINGS.easeOutCubic, repeat: Infinity },
}

export const HEARTBEAT = {
  keyframes: { scale: [1, 1.06, 1, 1.04, 1] },
  options: { duration: 1.2, ease: EASINGS.easeInOutSine, repeat: Infinity, repeatDelay: 0.8 },
}

export const PRESSABLE = {
  whileHover: { y: -2 },
  whileTap: { y: 3, scale: 0.97 },
  transition: SPRINGS.push3d,
}
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run src/motion && npm run typecheck`
Expected: PASS. Se algum tipo do Motion divergir (ex.: `Variants` com função), ajuste apenas a anotação de tipo.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/motion
git commit -m "feat(motion): add named springs, easings and presets from the motion reference"
```

---

### Task 1.2: Preferências de movimento e provider global

**Files:**
- Create: `src/motion/useMotionPrefs.ts`, `src/motion/MotionProvider.tsx`
- Modify: `src/app/App.tsx`
- Create: `docs/motion.md`
- Test: `src/motion/MotionProvider.test.tsx`

**Interfaces:**
- Consumes: `useReducedMotion` (existente), `useSettingsStore`.
- Produces:
  - `useMotionPrefs(): { reduced: boolean; decorative: boolean; ambient: boolean }` — `decorative = !reduced`; `ambient = !reduced && !settings.lowGraphics`
  - `MotionProvider({ children })`

- [ ] **Step 1: Escrever teste que falha `src/motion/MotionProvider.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { useReducedMotionConfig } from 'motion/react'
import { MotionProvider } from '@/motion/MotionProvider'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'

function Probe() {
  const reduced = useReducedMotionConfig()
  const prefs = useMotionPrefs()
  return <p>{`${String(reduced)}|${prefs.decorative}|${prefs.ambient}`}</p>
}

describe('MotionProvider', () => {
  it('runs full motion by default', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full' } })
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    )
    expect(screen.getByText('false|true|true')).toBeInTheDocument()
  })

  it('reduces motion and disables decorative effects when requested', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'reduced' } })
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    )
    expect(screen.getByText('true|false|false')).toBeInTheDocument()
  })

  it('keeps decorative effects but stops ambient loops in low graphics mode', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full', lowGraphics: true } })
    render(
      <MotionProvider>
        <Probe />
      </MotionProvider>,
    )
    expect(screen.getByText('false|true|false')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/motion/MotionProvider.test.tsx`
Expected: FAIL — módulos não encontrados.

- [ ] **Step 3: Implementar `src/motion/useMotionPrefs.ts`**

```ts
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSettingsStore } from '@/stores/settingsStore'

export function useMotionPrefs(): { reduced: boolean; decorative: boolean; ambient: boolean } {
  const reduced = useReducedMotion()
  const lowGraphics = useSettingsStore((store) => store.settings.lowGraphics)
  return { reduced, decorative: !reduced, ambient: !reduced && !lowGraphics }
}
```

- [ ] **Step 4: Implementar `src/motion/MotionProvider.tsx`**

```tsx
import type { ReactNode } from 'react'
import { MotionConfig } from 'motion/react'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

export function MotionProvider({ children }: { children: ReactNode }) {
  const { reduced } = useMotionPrefs()
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'} transition={{ duration: DURATIONS.fadeSlide, ease: EASINGS.easeOutCubic }}>
      {children}
    </MotionConfig>
  )
}
```

- [ ] **Step 5: Envolver o app em `src/app/App.tsx`**

Substituir o arquivo por:
```tsx
import { HashRouter, useRoutes } from 'react-router'
import { appRoutes } from '@/app/routes'
import { PreferenceSync } from '@/app/PreferenceSync'
import { MusicPlayer } from '@/app/MusicPlayer'
import { MotionProvider } from '@/motion/MotionProvider'

function AppRoutes() {
  return useRoutes(appRoutes)
}

export function App() {
  return (
    <HashRouter>
      <MotionProvider>
        <PreferenceSync />
        <MusicPlayer />
        <AppRoutes />
      </MotionProvider>
    </HashRouter>
  )
}
```
(`AppRoutes` vira `AnimatedRoutes` na Fase 3.)

- [ ] **Step 6: Criar `docs/motion.md`**

```markdown
# Sistema de movimento do AgroBlocks

Toda animação usa a biblioteca Motion (`motion/react` na interface, `animate()` de `motion` na cena 3D) e os valores de `src/motion/`. Os padrões vêm da Motion Reference (https://motion-reference.takayustudio.jp).

## Molas (`SPRINGS`)

| Nome | stiffness / damping / mass | Padrão de origem | Uso |
|---|---|---|---|
| snap | 180 / 13 / 0.6 | Springs › Snap | giro do robô, estados |
| bounce | 150 / 9 / 0.8 | Springs › Bounce | plantas crescendo |
| smooth | 120 / 26 / 1 | Springs › Smooth | movimento do robô, câmera |
| modal | 280 / 28 / 1 | Springs › Apple modal | painéis |
| sheet | 260 / 20 / 1 | Navigation & Overlays › Spring Sheet | diálogos |
| pill | 240 / 24 / 1 | Selection & Controls › Pill Indicator | abas, interruptores, velocidade |
| push3d | 420 / 24 / 1 | UI Buttons › 3D Push | botões |
| star | 400 / 14 / 1 | Rewards & Loot › Three Star Clear | estrelas do resultado |
| marker | 150 / 15 / 1 | Game HUD › Objective Marker | fase disponível no mapa |
| achievement | 240 / 22 / 1 | Rewards & Loot › Achievement Unlock | conceito aprendido |
| toast | 300 / 24 / 1 | Feedback & Reactions › Toast | linhas do console |
| cameraKick | 220 / 18 / 1 | Game Impact FX › Camera Kick HUD | erro do robô |
| jelly | 290 / 6.8 / 1 | UI Buttons › Jelly Squash | destaques |

## Durações e easings (`DURATIONS`, `EASINGS`)

| Preset | Duração | Easing | Padrão de origem |
|---|---|---|---|
| fadeSlide | 600ms | easeOutCubic | Entrance & Exit › Fade + Slide |
| softRise | 900ms | easeOutSine | Entrance & Exit › Soft Rise |
| snapIn | 380ms | easeOutExpo | Entrance & Exit › Snap In |
| shrinkFadeExit | 520ms | easeInCubic | Entrance & Exit › Shrink Fade Exit |
| staggerList | 760ms | easeOutCubic | List & Grid › Staggered List |
| gridWave | 900ms | easeOutCubic | List & Grid › Grid Wave |
| overshoot | 600ms | easeOutBack | Bounce & Reaction › Overshoot |
| questBanner | 800ms | easeOutExpo | Progression & Quests › Quest Banner |
| errorShake | 540ms | easeOutExpo | Attention & Emphasis › Error Shake |
| nudge | 520ms | easeOutBack | Attention & Emphasis › Nudge |
| badgePop | 450ms | easeOutBack | Attention & Emphasis › Badge Pop |
| focusHalo | 900ms | easeOutCubic | Attention & Emphasis › Focus Halo |
| blurCrossfade | 600ms | easeInOutSine | Transitions › Blur Crossfade |
| iris | 600ms | easeInCubic | Transitions › Iris |
| push | 400ms | easeInOutCubic | Transitions › Push / Slide |
| odometer | 750ms | easeOutCubic | Numbers & Data › Odometer Digit Roll |
| countUp | 2000ms | easeOutExpo | Numbers & Data › Count Up |
| rowExpand | 720ms | easeOutBack | List & Grid › Row Expand |
| harvestFlight | 900ms | easeInQuad | Game HUD › Coin Collect |
| confetti | 2800ms | linear | Feedback & Reactions › Confetti Rain |

## Regras

- Componentes não usam números de animação soltos: tudo vem de `src/motion/`.
- "Reduzir animações" ou `prefers-reduced-motion`: `MotionConfig reducedMotion="always"`; efeitos decorativos (confete, voo da colheita, partículas 3D) não montam; loops ambientes param também em "Gráficos leves".
- A velocidade de execução (0,5x–4x) escala só as molas do robô e da fazenda (`scaleSpring`).
- Animações do jogo só começam depois do evento aplicado pelo motor.
```

- [ ] **Step 7: Rodar e ver passar**

Run: `npx vitest run && npm run typecheck`
Expected: PASS em toda a suíte (285 + novos).

- [ ] **Step 8: Commit**

```bash
git add src/motion src/app/App.tsx docs/motion.md
git commit -m "feat(motion): add motion preferences, global MotionConfig and motion documentation"
```
