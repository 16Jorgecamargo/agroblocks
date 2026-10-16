# Phase 3 — How-to animations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Read `plan_index.md` first (Global Constraints).

**Spec:** section 6.

Ruling carried from planning: spec 6.3 types `dragging` as `{ label, x, y } | null`; the plan uses `dragging: string | null` (the dragged block is drawn at the hand position), which removes duplicated coordinates. Ledger it in Task 3.1.

### Task 3.1: Replica engine — types, layout and `replicaAt`

**Files:**
- Create: `src/features/tutorial/howto/howtoTypes.ts`, `src/features/tutorial/howto/replicaLayout.ts`, `src/features/tutorial/howto/replicaAt.ts`, `src/features/tutorial/howto/replicaAt.test.ts`

**Interfaces:**
- Consumes: `HowToId`, `SideTab` (Task 1.1).
- Produces:
  - `type ReplicaPart = 'toolbox' | 'workspace' | 'trash' | 'key' | 'run' | 'side' | 'farm'`
  - `type HandMode = 'idle' | 'press' | 'drag'`
  - `interface Point { x: number; y: number }`
  - `interface ReplicaState { toolboxOpen: boolean; stack: string[]; dragging: string | null; trashOpen: boolean; selected: number | null; highlight: number | null; keyDown: boolean; run: 'idle' | 'running' | 'stepping'; stepMode: boolean; robotCell: number; robotHit: boolean; harvested: boolean; tab: SideTab; consoleLines: string[]; hintsShown: number }`
  - `interface HowToBeat { at: number; hand: Point & { mode: HandMode }; set?: Partial<ReplicaState> }`
  - `interface HowToSegment { label: string; caption: string; duration: number; initial: Partial<ReplicaState>; beats: HowToBeat[] }`
  - `interface HowToScript { id: HowToId; title: string; parts: ReplicaPart[]; segments: HowToSegment[] }`
  - `DEFAULT_REPLICA: ReplicaState`
  - `replicaAt(segment: HowToSegment, timeMs: number): { state: ReplicaState; hand: Point & { mode: HandMode } }`
  - `replicaLayout.ts`: `STAGE`, `MOVE`, `HARVEST`, `CATEGORY_POINTS`, `FLYOUT_LABELS`, `flyoutBlockAt(index)`, `HAT_POINT`, `stackBlockAt(index)`, `TRASH_POINT`, `KEY_POINT`, `RUN_POINT`, `STEP_TOGGLE_POINT`, `TAB_POINTS`, `HINT_BUTTON_POINT`, `farmCellAt(index)`, `PLANT_CELL`, `ROCK_CELL`, `toPercent(point)`

- [ ] **Step 1: Write the failing test**

`src/features/tutorial/howto/replicaAt.test.ts`:
```ts
import { DEFAULT_REPLICA, replicaAt } from '@/features/tutorial/howto/replicaAt'
import type { HowToSegment } from '@/features/tutorial/howto/howtoTypes'

const segment: HowToSegment = {
  label: 'Teste',
  caption: 'Legenda',
  duration: 2000,
  initial: { stack: ['mover para frente'] },
  beats: [
    { at: 0, hand: { x: 0, y: 0, mode: 'idle' } },
    { at: 1000, hand: { x: 100, y: 200, mode: 'drag' }, set: { dragging: 'mover para frente', stack: [] } },
    { at: 1500, hand: { x: 100, y: 200, mode: 'idle' }, set: { dragging: null, trashOpen: true } },
  ],
}

describe('replicaAt', () => {
  it('starts from the defaults merged with the segment initial state', () => {
    const { state, hand } = replicaAt(segment, 0)
    expect(state).toEqual({ ...DEFAULT_REPLICA, stack: ['mover para frente'] })
    expect(hand).toEqual({ x: 0, y: 0, mode: 'idle' })
  })

  it('moves the hand smoothly between beats and keeps the earlier beat mode', () => {
    const { hand, state } = replicaAt(segment, 500)
    expect(hand.x).toBeCloseTo(50)
    expect(hand.y).toBeCloseTo(100)
    expect(hand.mode).toBe('idle')
    expect(state.dragging).toBeNull()
  })

  it('applies a beat state change exactly at its time', () => {
    expect(replicaAt(segment, 999).state.dragging).toBeNull()
    expect(replicaAt(segment, 1000).state).toMatchObject({ dragging: 'mover para frente', stack: [] })
    expect(replicaAt(segment, 1000).hand.mode).toBe('drag')
  })

  it('holds the last state after the final beat', () => {
    const { state, hand } = replicaAt(segment, 5000)
    expect(state).toMatchObject({ dragging: null, trashOpen: true, stack: [] })
    expect(hand).toEqual({ x: 100, y: 200, mode: 'idle' })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/tutorial/howto/replicaAt.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

`src/features/tutorial/howto/howtoTypes.ts`:
```ts
import type { HowToId, SideTab } from '@/features/tutorial/tutorialTypes'

export type ReplicaPart = 'toolbox' | 'workspace' | 'trash' | 'key' | 'run' | 'side' | 'farm'

export type HandMode = 'idle' | 'press' | 'drag'

export interface Point {
  x: number
  y: number
}

export interface ReplicaState {
  toolboxOpen: boolean
  stack: string[]
  dragging: string | null
  trashOpen: boolean
  selected: number | null
  highlight: number | null
  keyDown: boolean
  run: 'idle' | 'running' | 'stepping'
  stepMode: boolean
  robotCell: number
  robotHit: boolean
  harvested: boolean
  tab: SideTab
  consoleLines: string[]
  hintsShown: number
}

export interface HowToBeat {
  at: number
  hand: Point & { mode: HandMode }
  set?: Partial<ReplicaState>
}

export interface HowToSegment {
  label: string
  caption: string
  duration: number
  initial: Partial<ReplicaState>
  beats: HowToBeat[]
}

export interface HowToScript {
  id: HowToId
  title: string
  parts: ReplicaPart[]
  segments: HowToSegment[]
}
```

`src/features/tutorial/howto/replicaLayout.ts`:
```ts
import type { Point } from '@/features/tutorial/howto/howtoTypes'
import type { SideTab } from '@/features/tutorial/tutorialTypes'

export const STAGE = { width: 640, height: 360 }

export const MOVE = 'mover para frente'
export const HARVEST = 'colher planta'

export const CATEGORY_POINTS = { movement: { x: 45, y: 30 }, farm: { x: 45, y: 64 } }

export const FLYOUT_LABELS = [MOVE, 'virar à esquerda', 'virar à direita', HARVEST]

export function flyoutBlockAt(index: number): Point {
  return { x: 100, y: 30 + 34 * index }
}

export const HAT_POINT: Point = { x: 245, y: 40 }

export function stackBlockAt(index: number): Point {
  return { x: 245, y: 70 + 30 * index }
}

export const TRASH_POINT: Point = { x: 375, y: 320 }
export const KEY_POINT: Point = { x: 310, y: 320 }
export const RUN_POINT: Point = { x: 520, y: 35 }
export const STEP_TOGGLE_POINT: Point = { x: 595, y: 80 }
export const TAB_POINTS: Record<SideTab, Point> = { console: { x: 440, y: 140 }, hints: { x: 510, y: 140 }, pseudocode: { x: 585, y: 140 } }
export const HINT_BUTTON_POINT: Point = { x: 520, y: 228 }

export function farmCellAt(index: number): Point {
  return { x: 432 + 44 * index, y: 305 }
}

export const PLANT_CELL = 2
export const ROCK_CELL = 3

export function toPercent(point: Point): { left: string; top: string } {
  return { left: `${(point.x / STAGE.width) * 100}%`, top: `${(point.y / STAGE.height) * 100}%` }
}
```

`src/features/tutorial/howto/replicaAt.ts`:
```ts
import type { HandMode, HowToSegment, Point, ReplicaState } from '@/features/tutorial/howto/howtoTypes'

export const DEFAULT_REPLICA: ReplicaState = {
  toolboxOpen: false,
  stack: [],
  dragging: null,
  trashOpen: false,
  selected: null,
  highlight: null,
  keyDown: false,
  run: 'idle',
  stepMode: false,
  robotCell: 0,
  robotHit: false,
  harvested: false,
  tab: 'console',
  consoleLines: [],
  hintsShown: 0,
}

function easeInOutSine(value: number): number {
  return -(Math.cos(Math.PI * value) - 1) / 2
}

export function replicaAt(segment: HowToSegment, timeMs: number): { state: ReplicaState; hand: Point & { mode: HandMode } } {
  let state: ReplicaState = { ...DEFAULT_REPLICA, ...segment.initial }
  const beats = segment.beats
  let current = beats[0]
  let next = beats[1]
  for (let index = 0; index < beats.length; index += 1) {
    const beat = beats[index]
    if (beat.at > timeMs) break
    if (beat.set) state = { ...state, ...beat.set }
    current = beat
    next = beats[index + 1]
  }
  if (!current) return { state, hand: { x: 0, y: 0, mode: 'idle' } }
  if (!next || timeMs < current.at) return { state, hand: { ...current.hand } }
  const progress = easeInOutSine((timeMs - current.at) / (next.at - current.at))
  return {
    state,
    hand: {
      x: current.hand.x + (next.hand.x - current.hand.x) * progress,
      y: current.hand.y + (next.hand.y - current.hand.y) * progress,
      mode: current.hand.mode,
    },
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/tutorial/howto/replicaAt.test.ts`
Expected: PASS (4 tests). The midpoint test: `easeInOutSine(0.5) = 0.5`, so 50/100.

- [ ] **Step 5: Commit**

```bash
git add src/features/tutorial/howto
git commit -m "feat(tutorial): replica state engine for how-to animations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3.2: The nine how-to scripts

**Files:**
- Create: `src/features/tutorial/howto/howtoScripts.ts`, `src/features/tutorial/howto/howtoScripts.test.ts`

**Interfaces:**
- Consumes: Task 3.1 types, layout constants, `replicaAt`.
- Produces: `HOWTO_SCRIPTS: Record<HowToId, HowToScript>`

Hand coordinates: a block is addressed by its left-middle point; the hand grabs it 15 px to the right (`x + 15`). Categories, buttons, tabs, trash and key are addressed by their centre.

- [ ] **Step 1: Write the failing test**

`src/features/tutorial/howto/howtoScripts.test.ts`:
```ts
import { HOWTO_SCRIPTS } from '@/features/tutorial/howto/howtoScripts'
import { replicaAt } from '@/features/tutorial/howto/replicaAt'
import { HARVEST, MOVE } from '@/features/tutorial/howto/replicaLayout'
import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'

const end = (id: keyof typeof HOWTO_SCRIPTS, segment = 0) => {
  const chosen = HOWTO_SCRIPTS[id].segments[segment]
  return replicaAt(chosen, chosen.duration).state
}

describe('HOWTO_SCRIPTS', () => {
  it('has a script for every practice step', () => {
    for (const step of TUTORIAL_STEPS) if (step.kind === 'practice') expect(HOWTO_SCRIPTS[step.howTo].id).toBe(step.howTo)
  })

  it('keeps beats in time order inside each segment', () => {
    for (const script of Object.values(HOWTO_SCRIPTS)) {
      for (const segment of script.segments) {
        const times = segment.beats.map((beat) => beat.at)
        expect(times).toEqual([...times].sort((a, b) => a - b))
        expect(times.at(-1)).toBeLessThanOrEqual(segment.duration)
      }
    }
  })

  it('ends every segment in the state the gesture produces', () => {
    expect(end('add-block').stack).toEqual([MOVE])
    expect(end('snap-blocks').stack).toEqual([MOVE, MOVE])
    expect(HOWTO_SCRIPTS['delete-block'].segments.map((segment) => segment.label)).toEqual(['Lixeira', 'Biblioteca', 'Delete'])
    for (const index of [0, 1, 2]) expect(end('delete-block', index).stack).toEqual([MOVE])
    expect(end('open-pseudocode').tab).toBe('pseudocode')
    expect(end('run-stop')).toMatchObject({ run: 'idle', robotCell: 0 })
    expect(end('step-mode')).toMatchObject({ stepMode: true, robotCell: 2 })
    expect(end('hints')).toMatchObject({ tab: 'hints', hintsShown: 1 })
    expect(end('error-experiment')).toMatchObject({ robotHit: true, tab: 'console' })
    expect(end('fix')).toMatchObject({ stack: [MOVE, MOVE, HARVEST], harvested: true })
  })

  it('drops the dragged block and closes the trash by the end of every segment', () => {
    for (const script of Object.values(HOWTO_SCRIPTS)) {
      for (const segment of script.segments) {
        const state = replicaAt(segment, segment.duration).state
        expect(state.dragging).toBeNull()
        expect(state.trashOpen).toBe(false)
        expect(state.keyDown).toBe(false)
      }
    }
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/tutorial/howto/howtoScripts.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

`src/features/tutorial/howto/howtoScripts.ts`:
```ts
import type { HowToBeat, HowToScript, Point } from '@/features/tutorial/howto/howtoTypes'
import {
  CATEGORY_POINTS,
  flyoutBlockAt,
  HARVEST,
  HINT_BUTTON_POINT,
  KEY_POINT,
  MOVE,
  RUN_POINT,
  stackBlockAt,
  STEP_TOGGLE_POINT,
  TAB_POINTS,
  TRASH_POINT,
} from '@/features/tutorial/howto/replicaLayout'
import type { HowToId } from '@/features/tutorial/tutorialTypes'

const REST: Point = { x: 330, y: 250 }
const SIDE_REST: Point = { x: 470, y: 280 }

function grab(point: Point): Point {
  return { x: point.x + 15, y: point.y }
}

function idle(at: number, point: Point, set?: HowToBeat['set']): HowToBeat {
  return { at, hand: { ...point, mode: 'idle' }, set }
}

function press(at: number, point: Point, set?: HowToBeat['set']): HowToBeat {
  return { at, hand: { ...point, mode: 'press' }, set }
}

function drag(at: number, point: Point, set?: HowToBeat['set']): HowToBeat {
  return { at, hand: { ...point, mode: 'drag' }, set }
}

function openMovementAndDrag(start: number, dropAt: Point, stackAfter: string[]): HowToBeat[] {
  return [
    idle(start, CATEGORY_POINTS.movement),
    press(start + 300, CATEGORY_POINTS.movement, { toolboxOpen: true }),
    idle(start + 600, CATEGORY_POINTS.movement),
    idle(start + 1100, grab(flyoutBlockAt(0))),
    drag(start + 1400, grab(flyoutBlockAt(0)), { dragging: MOVE }),
    drag(start + 2400, grab(dropAt)),
    idle(start + 2700, grab(dropAt), { dragging: null, stack: stackAfter, toolboxOpen: false }),
  ]
}

export const HOWTO_SCRIPTS: Record<HowToId, HowToScript> = {
  'add-block': {
    id: 'add-block',
    title: 'Como adicionar um bloco',
    parts: ['toolbox', 'workspace', 'trash'],
    segments: [
      {
        label: 'Adicionar',
        caption: 'Clique em Movimento, segure o bloco "mover para frente" e solte dentro de "quando executar".',
        duration: 4200,
        initial: { stack: [] },
        beats: [idle(0, REST), ...openMovementAndDrag(600, stackBlockAt(0), [MOVE]), idle(4200, REST)],
      },
    ],
  },
  'snap-blocks': {
    id: 'snap-blocks',
    title: 'Como encaixar blocos',
    parts: ['toolbox', 'workspace', 'trash'],
    segments: [
      {
        label: 'Encaixar',
        caption: 'Arraste outro bloco e solte logo embaixo do primeiro: ele encaixa sozinho.',
        duration: 4200,
        initial: { stack: [MOVE] },
        beats: [idle(0, REST), ...openMovementAndDrag(600, stackBlockAt(1), [MOVE, MOVE]), idle(4200, REST)],
      },
    ],
  },
  'delete-block': {
    id: 'delete-block',
    title: 'Como apagar um bloco',
    parts: ['toolbox', 'workspace', 'trash', 'key'],
    segments: [
      {
        label: 'Lixeira',
        caption: 'Arraste o bloco até a lixeira e solte.',
        duration: 3400,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(600, grab(stackBlockAt(1))),
          drag(900, grab(stackBlockAt(1)), { dragging: MOVE, stack: [MOVE] }),
          drag(2000, TRASH_POINT, { trashOpen: true }),
          idle(2300, TRASH_POINT, { dragging: null, trashOpen: false }),
          idle(3400, REST),
        ],
      },
      {
        label: 'Biblioteca',
        caption: 'Ou arraste o bloco de volta para as categorias, à esquerda.',
        duration: 3400,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(600, grab(stackBlockAt(1))),
          drag(900, grab(stackBlockAt(1)), { dragging: MOVE, stack: [MOVE] }),
          drag(2000, { x: 45, y: 150 }),
          idle(2300, { x: 45, y: 150 }, { dragging: null }),
          idle(3400, REST),
        ],
      },
      {
        label: 'Delete',
        caption: 'Ou clique no bloco para selecionar e aperte a tecla Delete.',
        duration: 3400,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(600, grab(stackBlockAt(1))),
          press(900, grab(stackBlockAt(1)), { selected: 1 }),
          idle(1200, grab(stackBlockAt(1))),
          idle(1700, KEY_POINT),
          press(2000, KEY_POINT, { keyDown: true }),
          idle(2250, KEY_POINT, { keyDown: false, stack: [MOVE], selected: null }),
          idle(3400, REST),
        ],
      },
    ],
  },
  'open-pseudocode': {
    id: 'open-pseudocode',
    title: 'Como ver o pseudocódigo',
    parts: ['workspace', 'side'],
    segments: [
      {
        label: 'Pseudocódigo',
        caption: 'Clique na aba Pseudocódigo: o programa aparece escrito em texto.',
        duration: 2800,
        initial: { stack: [MOVE] },
        beats: [idle(0, SIDE_REST), idle(700, TAB_POINTS.pseudocode), press(1000, TAB_POINTS.pseudocode, { tab: 'pseudocode' }), idle(1300, TAB_POINTS.pseudocode), idle(2800, SIDE_REST)],
      },
    ],
  },
  'run-stop': {
    id: 'run-stop',
    title: 'Como executar e parar',
    parts: ['workspace', 'run', 'farm'],
    segments: [
      {
        label: 'Executar e Parar',
        caption: 'Clique em Executar. Enquanto o robô anda, clique em Parar: tudo volta ao início.',
        duration: 5200,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(700, RUN_POINT),
          press(1000, RUN_POINT, { run: 'running', highlight: 0 }),
          idle(1300, RUN_POINT),
          idle(2300, RUN_POINT, { robotCell: 1, highlight: 1 }),
          press(3000, RUN_POINT, { run: 'idle', robotCell: 0, highlight: null }),
          idle(3300, RUN_POINT),
          idle(5200, SIDE_REST),
        ],
      },
    ],
  },
  'step-mode': {
    id: 'step-mode',
    title: 'Como usar o passo a passo',
    parts: ['workspace', 'run', 'farm'],
    segments: [
      {
        label: 'Passo a passo',
        caption: 'Ligue Passo a passo e clique em Próximo: o robô faz um bloco por clique.',
        duration: 5600,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(700, STEP_TOGGLE_POINT),
          press(1000, STEP_TOGGLE_POINT, { stepMode: true }),
          idle(1300, STEP_TOGGLE_POINT),
          idle(1900, RUN_POINT),
          press(2200, RUN_POINT, { run: 'stepping', robotCell: 1, highlight: 0 }),
          idle(2500, RUN_POINT),
          press(3300, RUN_POINT, { robotCell: 2, highlight: 1 }),
          idle(3600, RUN_POINT),
          idle(5600, SIDE_REST),
        ],
      },
    ],
  },
  hints: {
    id: 'hints',
    title: 'Como pedir uma dica',
    parts: ['side'],
    segments: [
      {
        label: 'Dicas',
        caption: 'Abra a aba Dicas e clique em "Pedir dica".',
        duration: 3800,
        initial: {},
        beats: [
          idle(0, SIDE_REST),
          idle(700, TAB_POINTS.hints),
          press(1000, TAB_POINTS.hints, { tab: 'hints' }),
          idle(1300, TAB_POINTS.hints),
          idle(1900, HINT_BUTTON_POINT),
          press(2200, HINT_BUTTON_POINT, { hintsShown: 1 }),
          idle(2500, HINT_BUTTON_POINT),
          idle(3800, SIDE_REST),
        ],
      },
    ],
  },
  'error-experiment': {
    id: 'error-experiment',
    title: 'Experimento: andar demais',
    parts: ['workspace', 'run', 'farm', 'side'],
    segments: [
      {
        label: 'Experimento',
        caption: 'Com três "mover para frente", o robô passa da planta e bate na pedra. O Console explica o erro.',
        duration: 5800,
        initial: { stack: [MOVE, MOVE, MOVE, HARVEST] },
        beats: [
          idle(0, REST),
          idle(700, RUN_POINT),
          press(1000, RUN_POINT, { run: 'running', highlight: 0 }),
          idle(1300, RUN_POINT),
          idle(1900, RUN_POINT, { robotCell: 1, highlight: 1 }),
          idle(2500, RUN_POINT, { robotCell: 2, highlight: 2 }),
          idle(3100, RUN_POINT, { robotHit: true, run: 'idle', highlight: null, tab: 'console', consoleLines: ['O robô bateu na pedra.'] }),
          idle(5800, SIDE_REST),
        ],
      },
    ],
  },
  fix: {
    id: 'fix',
    title: 'Como corrigir o programa',
    parts: ['workspace', 'trash', 'key', 'run', 'farm'],
    segments: [
      {
        label: 'Corrigir',
        caption: 'Selecione um "mover para frente" a mais, aperte Delete e execute de novo: o robô colhe a planta.',
        duration: 6400,
        initial: { stack: [MOVE, MOVE, MOVE, HARVEST] },
        beats: [
          idle(0, REST),
          idle(600, grab(stackBlockAt(2))),
          press(900, grab(stackBlockAt(2)), { selected: 2 }),
          idle(1200, grab(stackBlockAt(2))),
          idle(1700, KEY_POINT),
          press(2000, KEY_POINT, { keyDown: true }),
          idle(2250, KEY_POINT, { keyDown: false, stack: [MOVE, MOVE, HARVEST], selected: null }),
          idle(2900, RUN_POINT),
          press(3200, RUN_POINT, { run: 'running', highlight: 0 }),
          idle(3500, RUN_POINT),
          idle(4000, RUN_POINT, { robotCell: 1, highlight: 1 }),
          idle(4600, RUN_POINT, { robotCell: 2, highlight: 2 }),
          idle(5200, RUN_POINT, { harvested: true, run: 'idle', highlight: null }),
          idle(6400, SIDE_REST),
        ],
      },
    ],
  },
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/tutorial/howto`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tutorial/howto
git commit -m "feat(tutorial): how-to scripts for every practice step

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3.3: Replica components, stage and `HowToDialog`

**Files:**
- Create: `src/features/tutorial/howto/Replica.tsx`, `src/features/tutorial/howto/HandCursor.tsx`, `src/features/tutorial/howto/HowToStage.tsx`, `src/features/tutorial/howto/HowToDialog.tsx`, `src/features/tutorial/howto/HowToDialog.css`, `src/features/tutorial/howto/HowToDialog.test.tsx`

**Interfaces:**
- Consumes: Tasks 3.1, 3.2; `GameDialog`, `DialogSection` (`src/components/game/GameDialog.tsx`, props `open`, `title`, `icon`, `tone`, `size`, `onClose`), `GameButton`, `useMotionPrefs`, `DURATIONS.howtoLoopPause`.
- Produces:
  - `Replica({ parts, state }: { parts: ReplicaPart[]; state: ReplicaState })`
  - `HandCursor({ x, y, mode }: Point & { mode: HandMode })`
  - `HowToStage({ script, segment, reduced, playKey }: { script: HowToScript; segment: number; reduced: boolean; playKey: number })` — root `.howto-stage` with `data-segment`, `data-frame` (reduced) attributes; calls nothing outward; in full motion loops the segment with `useAnimationFrame`; in reduced mode shows beat frames with "Quadro anterior"/"Próximo quadro" buttons
  - `HowToDialog({ open, howTo, onPractice }: { open: boolean; howTo: HowToId; onPractice: () => void })` — `GameDialog` titled with `HOWTO_SCRIPTS[howTo].title`, segment indicator (`role="tablist"` "Formas de fazer", one `role="tab"` per segment when there are 2+), caption, buttons "Ver de novo" and "Praticar"

- [ ] **Step 1: Write the failing test**

`src/features/tutorial/howto/HowToDialog.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { HowToDialog } from '@/features/tutorial/howto/HowToDialog'
import { HOWTO_SCRIPTS } from '@/features/tutorial/howto/howtoScripts'
import { useSettingsStore } from '@/stores/settingsStore'

describe('HowToDialog', () => {
  afterEach(() => useSettingsStore.getState().update({ motion: 'full' }))

  it('shows the script title, the first caption and the replica', () => {
    render(<HowToDialog open howTo="add-block" onPractice={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'Como adicionar um bloco' })).toBeInTheDocument()
    expect(screen.getByText(HOWTO_SCRIPTS['add-block'].segments[0].caption)).toBeInTheDocument()
    expect(document.querySelector('.howto-stage .replica')).not.toBeNull()
    expect(document.querySelector('.howto-hand')).not.toBeNull()
  })

  it('switches between the three ways to delete a block', () => {
    render(<HowToDialog open howTo="delete-block" onPractice={vi.fn()} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Lixeira', 'Biblioteca', 'Delete'])
    fireEvent.click(screen.getByRole('tab', { name: 'Delete' }))
    expect(screen.getByRole('tab', { name: 'Delete' })).toHaveAttribute('aria-selected', 'true')
    expect(document.querySelector('.howto-stage')).toHaveAttribute('data-segment', '2')
    expect(screen.getByText(HOWTO_SCRIPTS['delete-block'].segments[2].caption)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver de novo' }))
    expect(document.querySelector('.howto-stage')).toHaveAttribute('data-segment', '0')
  })

  it('hands control back with Praticar', () => {
    const onPractice = vi.fn()
    render(<HowToDialog open howTo="hints" onPractice={onPractice} />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Praticar' }))
    expect(onPractice).toHaveBeenCalledTimes(1)
  })

  it('shows still frames with arrows when motion is reduced', () => {
    useSettingsStore.getState().update({ motion: 'reduced' })
    render(<HowToDialog open howTo="add-block" onPractice={vi.fn()} />)
    const stage = document.querySelector('.howto-stage')
    expect(stage).toHaveAttribute('data-frame', '0')
    fireEvent.click(screen.getByRole('button', { name: 'Próximo quadro' }))
    expect(stage).toHaveAttribute('data-frame', '1')
    fireEvent.click(screen.getByRole('button', { name: 'Quadro anterior' }))
    expect(stage).toHaveAttribute('data-frame', '0')
  })
})
```

Before writing it, check the settings store API: `grep -n "update\|motion" src/stores/settingsStore.ts`. If the setter is not named `update`, use the real name in the test (ledger nothing — it is a test detail).

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/tutorial/howto/HowToDialog.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

`src/features/tutorial/howto/HandCursor.tsx`:
```tsx
import type { HandMode, Point } from '@/features/tutorial/howto/howtoTypes'
import { toPercent } from '@/features/tutorial/howto/replicaLayout'

export function HandCursor({ x, y, mode }: Point & { mode: HandMode }) {
  return (
    <span className={`howto-hand howto-hand--${mode}`} style={toPercent({ x, y })} aria-hidden="true">
      {mode === 'press' && <span className="howto-hand__ring" />}
      <svg viewBox="0 0 32 32" focusable="false">
        <path
          d="M11 3.5c1.4 0 2.5 1.1 2.5 2.5v8.2l1-.3V4.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v9l1 .2V7c0-1.4 1.1-2.5 2.5-2.5S25.5 5.6 25.5 7v12.5c0 5.2-3.8 9.5-9 9.5h-1.2c-2.9 0-5.5-1.5-7-3.9L4 18.6c-.8-1.2-.4-2.8.8-3.5 1.1-.6 2.5-.3 3.2.7l.5.7V6c0-1.4 1.1-2.5 2.5-2.5z"
          fill={mode === 'drag' ? '#ffe7c2' : '#fff4e0'}
          stroke="#1b2630"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
```

`src/features/tutorial/howto/Replica.tsx`:
```tsx
import type { CSSProperties } from 'react'
import type { ReplicaPart, ReplicaState } from '@/features/tutorial/howto/howtoTypes'
import {
  CATEGORY_POINTS,
  farmCellAt,
  FLYOUT_LABELS,
  flyoutBlockAt,
  HAT_POINT,
  HINT_BUTTON_POINT,
  KEY_POINT,
  PLANT_CELL,
  ROCK_CELL,
  RUN_POINT,
  stackBlockAt,
  STEP_TOGGLE_POINT,
  TAB_POINTS,
  toPercent,
  TRASH_POINT,
} from '@/features/tutorial/howto/replicaLayout'
import type { SideTab } from '@/features/tutorial/tutorialTypes'

const TAB_LABELS: Record<SideTab, string> = { console: 'Console', hints: 'Dicas', pseudocode: 'Pseudocódigo' }

function tone(label: string): string {
  return label === 'colher planta' ? 'farm' : 'movement'
}

function at(point: { x: number; y: number }): CSSProperties {
  return toPercent(point)
}

export function Replica({ parts, state }: { parts: ReplicaPart[]; state: ReplicaState }) {
  const show = new Set(parts)
  return (
    <div className="replica" aria-hidden="true">
      {show.has('toolbox') && (
        <>
          <div className="replica__toolbox" />
          <span className="replica__category replica__category--movement" style={at(CATEGORY_POINTS.movement)}>
            Movimento
          </span>
          <span className="replica__category replica__category--farm" style={at(CATEGORY_POINTS.farm)}>
            Agricultura
          </span>
          {state.toolboxOpen && (
            <div className="replica__flyout">
              {FLYOUT_LABELS.map((label, index) => (
                <span key={label} className={`replica__block replica__block--${tone(label)}`} style={at(flyoutBlockAt(index))}>
                  {label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      {show.has('workspace') && (
        <>
          <span className="replica__block replica__block--hat" style={at(HAT_POINT)}>
            quando executar
          </span>
          {state.stack.map((label, index) => (
            <span
              key={`${index}-${label}`}
              className={`replica__block replica__block--${tone(label)}${state.selected === index ? ' is-selected' : ''}${state.highlight === index ? ' is-running' : ''}`}
              style={at(stackBlockAt(index))}
            >
              {label}
            </span>
          ))}
        </>
      )}
      {show.has('trash') && (
        <span className={`replica__trash${state.trashOpen ? ' is-open' : ''}`} style={at(TRASH_POINT)}>
          <span className="replica__trash-lid" />
          <span className="replica__trash-can" />
        </span>
      )}
      {show.has('key') && (
        <span className={`replica__key${state.keyDown ? ' is-down' : ''}`} style={at(KEY_POINT)}>
          Delete
        </span>
      )}
      {show.has('run') && (
        <>
          <span className={`replica__run replica__run--${state.run === 'running' ? 'stop' : 'go'}`} style={at(RUN_POINT)}>
            {state.run === 'running' ? 'Parar' : state.stepMode ? 'Próximo' : 'Executar'}
          </span>
          <span className={`replica__toggle${state.stepMode ? ' is-on' : ''}`} style={at(STEP_TOGGLE_POINT)}>
            <span className="replica__toggle-label">Passo a passo</span>
            <span className="replica__toggle-track" />
          </span>
        </>
      )}
      {show.has('side') && (
        <div className="replica__side">
          {(Object.keys(TAB_POINTS) as SideTab[]).map((tab) => (
            <span key={tab} className={`replica__tab${state.tab === tab ? ' is-active' : ''}`} style={at(TAB_POINTS[tab])}>
              {TAB_LABELS[tab]}
            </span>
          ))}
          <div className="replica__panel">
            {state.tab === 'console' && (state.consoleLines.length ? state.consoleLines : ['Pronto para executar.']).map((line) => <p key={line} className={state.consoleLines.length ? 'is-error' : ''}>{line}</p>)}
            {state.tab === 'pseudocode' && <pre>{['quando executar:', ...state.stack.map((label) => `    ${label}`)].join('\n')}</pre>}
            {state.tab === 'hints' && state.hintsShown > 0 && <p className="is-hint">Conte quantas casas há até a planta.</p>}
          </div>
          {state.tab === 'hints' && (
            <span className="replica__hint-button" style={at(HINT_BUTTON_POINT)}>
              Pedir dica
            </span>
          )}
        </div>
      )}
      {show.has('farm') && (
        <div className="replica__farm">
          {[0, 1, 2, 3, 4].map((cell) => (
            <span key={cell} className="replica__cell" style={at(farmCellAt(cell))}>
              {cell === PLANT_CELL && !state.harvested && <span className="replica__plant" />}
              {cell === ROCK_CELL && <span className="replica__rock" />}
            </span>
          ))}
          <span className={`replica__robot${state.robotHit ? ' is-hit' : ''}`} style={at(farmCellAt(state.robotCell))}>
            <span className="replica__robot-eyes">{state.robotHit ? '× ×' : '● ●'}</span>
          </span>
        </div>
      )}
    </div>
  )
}
```

`src/features/tutorial/howto/HowToStage.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react'
import { useAnimationFrame } from 'motion/react'
import { HandCursor } from '@/features/tutorial/howto/HandCursor'
import type { HowToScript } from '@/features/tutorial/howto/howtoTypes'
import { Replica } from '@/features/tutorial/howto/Replica'
import { replicaAt } from '@/features/tutorial/howto/replicaAt'
import { toPercent } from '@/features/tutorial/howto/replicaLayout'
import { DURATIONS } from '@/motion/presets'

interface HowToStageProps {
  script: HowToScript
  segment: number
  reduced: boolean
  playKey: number
}

export function HowToStage({ script, segment, reduced, playKey }: HowToStageProps) {
  const chosen = script.segments[segment]
  const [time, setTime] = useState(0)
  const [frame, setFrame] = useState(0)
  const started = useRef<number | null>(null)

  useEffect(() => {
    started.current = null
    setTime(0)
    setFrame(0)
  }, [segment, playKey, script])

  useAnimationFrame((now) => {
    if (reduced) return
    if (started.current === null) started.current = now
    const cycle = chosen.duration + DURATIONS.howtoLoopPause * 1000
    setTime(Math.min((now - started.current) % cycle, chosen.duration))
  })

  const beats = chosen.beats
  const frameTime = beats[Math.min(frame, beats.length - 1)]?.at ?? 0
  const { state, hand } = replicaAt(chosen, reduced ? frameTime : time)

  return (
    <div className="howto-stage" data-segment={segment} data-frame={reduced ? frame : undefined}>
      <Replica parts={script.parts} state={state} />
      {state.dragging && (
        <span className="replica__block replica__block--movement replica__block--dragging" style={toPercent({ x: hand.x - 15, y: hand.y })} aria-hidden="true">
          {state.dragging}
        </span>
      )}
      <HandCursor {...hand} />
      {reduced && (
        <div className="howto-stage__frames">
          <button type="button" className="icon-button" aria-label="Quadro anterior" disabled={frame === 0} onClick={() => setFrame((value) => Math.max(0, value - 1))}>
            ←
          </button>
          <span>
            {frame + 1}/{beats.length}
          </span>
          <button type="button" className="icon-button" aria-label="Próximo quadro" disabled={frame >= beats.length - 1} onClick={() => setFrame((value) => Math.min(beats.length - 1, value + 1))}>
            →
          </button>
        </div>
      )}
    </div>
  )
}
```

`src/features/tutorial/howto/HowToDialog.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { HOWTO_SCRIPTS } from '@/features/tutorial/howto/howtoScripts'
import { HowToStage } from '@/features/tutorial/howto/HowToStage'
import type { HowToId } from '@/features/tutorial/tutorialTypes'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import './HowToDialog.css'

interface HowToDialogProps {
  open: boolean
  howTo: HowToId
  onPractice: () => void
}

export function HowToDialog({ open, howTo, onPractice }: HowToDialogProps) {
  const { reduced } = useMotionPrefs()
  const script = HOWTO_SCRIPTS[howTo]
  const [segment, setSegment] = useState(0)
  const [playKey, setPlayKey] = useState(0)

  useEffect(() => {
    setSegment(0)
  }, [howTo, open])

  const replay = () => {
    setSegment(0)
    setPlayKey((value) => value + 1)
  }

  return (
    <GameDialog open={open} title={script.title} icon="eye" tone="info" size="lg" onClose={onPractice}>
      <DialogSection className="howto-dialog__body">
        {script.segments.length > 1 && (
          <div className="howto-dialog__ways" role="tablist" aria-label="Formas de fazer">
            {script.segments.map((item, index) => (
              <button key={item.label} type="button" role="tab" aria-selected={index === segment} className={`howto-dialog__way${index === segment ? ' is-active' : ''}`} onClick={() => setSegment(index)}>
                {item.label}
              </button>
            ))}
          </div>
        )}
        <HowToStage script={script} segment={segment} reduced={reduced} playKey={playKey} />
        <p className="howto-dialog__caption">{script.segments[segment].caption}</p>
      </DialogSection>
      <DialogSection className="game-dialog__actions">
        <GameButton tone="secondary" icon="reset" onClick={replay}>
          Ver de novo
        </GameButton>
        <GameButton tone="primary" size="lg" icon="play" onClick={onPractice}>
          Praticar
        </GameButton>
      </DialogSection>
    </GameDialog>
  )
}
```

Segments with more than one entry advance on their own in full motion: in `HowToDialog`, add after the `replay` function:
```tsx
  useEffect(() => {
    if (reduced || script.segments.length < 2 || !open) return
    const cycle = script.segments[segment].duration + DURATIONS.howtoLoopPause * 1000
    const timer = window.setTimeout(() => setSegment((value) => (value + 1) % script.segments.length), cycle)
    return () => window.clearTimeout(timer)
  }, [reduced, script, segment, open, playKey])
```
and import `DURATIONS` from `@/motion/presets`.

`src/features/tutorial/howto/HowToDialog.css`:
```css
.howto-dialog__body {
  display: grid;
  gap: var(--space-3);
}

.howto-dialog__ways {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.howto-dialog__way {
  padding: 6px 14px;
  border: 2px solid #d6d9d2;
  border-radius: 999px;
  background: #ffffff;
  font-weight: 700;
  color: #44515c;
  cursor: pointer;
}

.howto-dialog__way.is-active {
  border-color: var(--dialog-tone);
  background: var(--dialog-tone);
  color: #ffffff;
}

.howto-dialog__caption {
  margin: 0;
  min-height: 2.6em;
  text-align: center;
  font-weight: 600;
  color: #24323d;
}

.howto-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  container-type: inline-size;
  border-radius: 14px;
  overflow: hidden;
  background: #f7f8f9;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
}

.howto-stage__frames {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.9);
  font-weight: 700;
}

.replica {
  position: absolute;
  inset: 0;
  font-size: 2.1cqw;
  font-family: Inter, system-ui, sans-serif;
}

.replica > *,
.replica__flyout > *,
.replica__side > *,
.replica__farm > * {
  position: absolute;
}

.replica__toolbox {
  left: 0;
  top: 0;
  bottom: 0;
  width: 14%;
  background: #ffffff;
  border-right: 1px solid #e3e1da;
}

.replica__category {
  transform: translate(-50%, -50%);
  padding: 0.3em 0.6em;
  border-radius: 0.5em;
  font-weight: 700;
  color: #13261c;
  white-space: nowrap;
  border-left: 0.5em solid currentColor;
}

.replica__category--movement {
  border-left-color: #4c8df6;
}

.replica__category--farm {
  border-left-color: #3fa34d;
}

.replica__flyout {
  left: 14%;
  top: 0;
  bottom: 0;
  width: 22%;
  background: #eef1f4;
}

.replica__block {
  transform: translateY(-50%);
  padding: 0.35em 0.7em;
  border-radius: 0.35em;
  color: #ffffff;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 0.15em 0 rgb(0 0 0 / 0.2);
}

.replica__block--movement {
  background: #4c8df6;
}

.replica__block--farm {
  background: #3fa34d;
}

.replica__block--hat {
  background: #c98b12;
  border-radius: 0.9em 0.9em 0.35em 0.35em;
}

.replica__block.is-selected {
  outline: 0.2em solid #f6c343;
}

.replica__block.is-running {
  outline: 0.2em dashed #f6c343;
}

.replica__block--dragging {
  position: absolute;
  z-index: 2;
  box-shadow: 0 0.6em 1em rgb(0 0 0 / 0.25);
  transform: translateY(-50%) rotate(-3deg);
}

.replica__trash {
  transform: translate(-50%, -50%);
  width: 2.4em;
  height: 2.8em;
}

.replica__trash-lid,
.replica__trash-can {
  position: absolute;
  left: 0;
  right: 0;
  background: #9aa3ab;
  border-radius: 0.2em;
}

.replica__trash-lid {
  top: 0;
  height: 0.4em;
  transform-origin: 0 100%;
  transition: transform 0.15s;
}

.replica__trash.is-open .replica__trash-lid {
  transform: rotate(-35deg) translateY(-0.2em);
}

.replica__trash-can {
  top: 0.55em;
  bottom: 0;
}

.replica__key {
  transform: translate(-50%, -50%);
  padding: 0.4em 0.8em;
  border-radius: 0.4em;
  background: #ffffff;
  border: 1px solid #c7ccd1;
  box-shadow: 0 0.25em 0 #c7ccd1;
  font-weight: 700;
  color: #24323d;
}

.replica__key.is-down {
  transform: translate(-50%, calc(-50% + 0.2em));
  box-shadow: 0 0.05em 0 #c7ccd1;
}

.replica__run {
  transform: translate(-50%, -50%);
  min-width: 7em;
  padding: 0.5em 1em;
  border-radius: 0.6em;
  text-align: center;
  font-weight: 800;
  color: #ffffff;
}

.replica__run--go {
  background: #3fa34d;
}

.replica__run--stop {
  background: #e5484d;
}

.replica__toggle {
  transform: translate(-100%, -50%);
  display: flex;
  align-items: center;
  gap: 0.5em;
  font-weight: 600;
  white-space: nowrap;
}

.replica__toggle-track {
  width: 2.2em;
  height: 1.2em;
  border-radius: 999px;
  background: #c7ccd1;
  position: relative;
}

.replica__toggle-track::after {
  content: '';
  position: absolute;
  top: 0.15em;
  left: 0.15em;
  width: 0.9em;
  height: 0.9em;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.15s;
}

.replica__toggle.is-on .replica__toggle-track {
  background: #3fa34d;
}

.replica__toggle.is-on .replica__toggle-track::after {
  transform: translateX(1em);
}

.replica__side {
  inset: 0;
}

.replica__tab {
  transform: translate(-50%, -50%);
  padding: 0.2em 0.4em;
  font-weight: 700;
  color: #6b7782;
  border-bottom: 0.15em solid transparent;
}

.replica__tab.is-active {
  color: #13261c;
  border-bottom-color: #3fa34d;
}

.replica__panel {
  left: 64%;
  top: 44%;
  width: 34%;
  height: 27%;
  padding: 0.5em;
  border-radius: 0.5em;
  background: #eef3ea;
  font-size: 0.9em;
}

.replica__panel p,
.replica__panel pre {
  margin: 0;
  white-space: pre-wrap;
}

.replica__panel .is-error {
  color: #c4363b;
  font-weight: 700;
}

.replica__panel .is-hint {
  color: #8a5a00;
  font-weight: 600;
}

.replica__hint-button {
  transform: translate(-50%, -50%);
  padding: 0.35em 0.8em;
  border-radius: 0.5em;
  background: #f6c343;
  font-weight: 700;
}

.replica__farm {
  inset: 0;
}

.replica__cell {
  transform: translate(-50%, -50%);
  width: 6.4%;
  aspect-ratio: 1;
  border-radius: 0.3em;
  background: #b98a55;
  box-shadow: inset 0 0 0 0.1em rgb(0 0 0 / 0.12);
}

.replica__plant {
  position: absolute;
  inset: 20%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #e5484d 25%, #3fa34d 26%);
}

.replica__rock {
  position: absolute;
  inset: 22%;
  border-radius: 40% 50% 35% 45%;
  background: #8b939a;
}

.replica__robot {
  transform: translate(-50%, -60%);
  width: 5.2%;
  aspect-ratio: 1;
  border-radius: 0.4em;
  background: #f4f1ea;
  border: 0.12em solid #1b2630;
  display: grid;
  place-items: center;
  transition: left 0.35s ease-in-out;
}

.replica__robot-eyes {
  font-size: 0.6em;
  color: #22c4e6;
  letter-spacing: 0.1em;
}

.replica__robot.is-hit .replica__robot-eyes {
  color: #e5484d;
}

.howto-hand {
  position: absolute;
  z-index: 3;
  width: 5%;
  transform: translate(-30%, -8%);
  pointer-events: none;
  filter: drop-shadow(0 0.2em 0.3em rgb(0 0 0 / 0.3));
}

.howto-hand--press svg {
  transform: scale(0.88);
}

.howto-hand__ring {
  position: absolute;
  left: 20%;
  top: -10%;
  width: 60%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 0.15em solid #f6c343;
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/features/tutorial && npx tsc --noEmit -p .`
Expected: PASS. If `useAnimationFrame` throws in jsdom, it does not (motion falls back to `setTimeout`-based frameloop); if a test fails for that reason, mock nothing — instead guard with `typeof window.requestAnimationFrame === 'function'` is already true in jsdom.

- [ ] **Step 5: Commit**

```bash
git add src/features/tutorial/howto
git commit -m "feat(tutorial): animated replica stage and how-to dialog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
