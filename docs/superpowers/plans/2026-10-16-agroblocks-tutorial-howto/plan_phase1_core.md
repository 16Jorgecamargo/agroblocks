# Phase 1 — Tutorial script, machine and signal bus

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Read `plan_index.md` first (Global Constraints).

**Spec:** sections 3, 4.

### Task 1.1: Types and the 15-step script

**Files:**
- Create: `src/features/tutorial/tutorialTypes.ts`, `src/features/tutorial/tutorialScript.ts`, `src/features/tutorial/tutorialScript.test.ts`

**Interfaces:**
- Produces:
  - `type TutorialTarget = 'hud-goal' | 'hud-harvest' | 'hud-actions' | 'farm' | 'editor' | 'execution' | 'side'`
  - `type SideTab = 'console' | 'hints' | 'pseudocode'`
  - `type HowToId = 'add-block' | 'snap-blocks' | 'delete-block' | 'open-pseudocode' | 'run-stop' | 'step-mode' | 'hints' | 'error-experiment' | 'fix'`
  - `type TutorialSignal` and `type TutorialCondition` (unions below)
  - `type CalloutSide = 'right' | 'left' | 'bottom' | 'top'`
  - `type TutorialStep` (union below), `TUTORIAL_STEPS: TutorialStep[]`

- [ ] **Step 1: Write the failing test**

`src/features/tutorial/tutorialScript.test.ts`:
```ts
import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'

describe('TUTORIAL_STEPS', () => {
  it('follows the approved 15-step order', () => {
    expect(TUTORIAL_STEPS.map((step) => `${step.id}:${step.kind}`)).toEqual([
      'welcome:intro',
      'goal:tour',
      'farm:tour',
      'add:practice',
      'snap:practice',
      'delete:practice',
      'pseudocode:practice',
      'run-stop:practice',
      'step-mode:practice',
      'hints:practice',
      'experiment:practice',
      'console:tour',
      'fix:practice',
      'hud-actions:tour',
      'done:outro',
    ])
  })

  it('gives every practice step an animation, conditions and targets, and every tour step a target', () => {
    for (const step of TUTORIAL_STEPS) {
      if (step.kind === 'practice') {
        expect(step.howTo).toBeTruthy()
        expect(step.done.length).toBeGreaterThan(0)
        expect(step.targets.length).toBeGreaterThan(0)
        expect(step.followUps?.length ?? 0).toBe(step.done.length - 1)
      }
      if (step.kind === 'tour') expect(step.targets.length).toBeGreaterThan(0)
    }
  })

  it('opens the console tab when the console tour starts', () => {
    expect(TUTORIAL_STEPS.find((step) => step.id === 'console')?.onEnterTab).toBe('console')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/tutorial/tutorialScript.test.ts`
Expected: FAIL — cannot resolve `@/features/tutorial/tutorialScript`.

- [ ] **Step 3: Implement**

`src/features/tutorial/tutorialTypes.ts`:
```ts
export type TutorialTarget = 'hud-goal' | 'hud-harvest' | 'hud-actions' | 'farm' | 'editor' | 'execution' | 'side'

export type SideTab = 'console' | 'hints' | 'pseudocode'

export type HowToId =
  | 'add-block'
  | 'snap-blocks'
  | 'delete-block'
  | 'open-pseudocode'
  | 'run-stop'
  | 'step-mode'
  | 'hints'
  | 'error-experiment'
  | 'fix'

export type CalloutSide = 'right' | 'left' | 'bottom' | 'top'

type SimpleSignalType = 'blockAdded' | 'blockRemoved' | 'hintRevealed' | 'stepModeOn' | 'stepped' | 'run' | 'stop' | 'error' | 'success'

export type TutorialSignal =
  | { type: SimpleSignalType }
  | { type: 'stackSize'; size: number }
  | { type: 'tabOpened'; tab: SideTab }

export type TutorialCondition =
  | { type: SimpleSignalType }
  | { type: 'stackSize'; atLeast: number }
  | { type: 'tabOpened'; tab: SideTab }

interface BaseStep {
  id: string
  title: string
  text: string
  onEnterTab?: SideTab
}

export type TutorialStep =
  | (BaseStep & { kind: 'intro' | 'outro' })
  | (BaseStep & { kind: 'tour'; targets: TutorialTarget[]; prefer?: CalloutSide })
  | (BaseStep & {
      kind: 'practice'
      targets: TutorialTarget[]
      prefer?: CalloutSide
      howTo: HowToId
      done: TutorialCondition[]
      followUps?: string[]
      notices?: Partial<Record<TutorialSignal['type'], string>>
    })
```

`src/features/tutorial/tutorialScript.ts`:
```ts
import type { TutorialStep } from '@/features/tutorial/tutorialTypes'

const EARLY_FINISH = 'O robô terminou antes. Encaixe mais um "mover para frente", execute de novo e clique em Parar enquanto ele anda.'

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    kind: 'intro',
    title: 'Bem-vindo ao treinamento',
    text: 'O robô agrícola segue, na ordem, as instruções do seu programa. Vamos conhecer cada parte da tela e praticar cada ação. Antes de cada ação, uma animação mostra como fazer.',
  },
  {
    id: 'goal',
    kind: 'tour',
    targets: ['hud-goal', 'hud-harvest'],
    prefer: 'bottom',
    title: 'Objetivo da fase',
    text: 'Aqui fica o objetivo da fase. O contador Colheita mostra quantas plantas você já colheu.',
  },
  {
    id: 'farm',
    kind: 'tour',
    targets: ['farm'],
    title: 'A fazenda',
    text: 'Esta é a fazenda: o robô, a planta madura e uma pedra. Use os botões para girar a câmera, aproximar e abrir a Legenda.',
  },
  {
    id: 'add',
    kind: 'practice',
    targets: ['editor'],
    howTo: 'add-block',
    title: 'Adicionar um bloco',
    text: 'Abra a categoria Movimento e arraste o bloco "mover para frente" para dentro de "quando executar".',
    done: [{ type: 'blockAdded' }],
  },
  {
    id: 'snap',
    kind: 'practice',
    targets: ['editor'],
    howTo: 'snap-blocks',
    title: 'Encaixar blocos',
    text: 'Arraste outro "mover para frente" e encaixe embaixo do primeiro.',
    done: [{ type: 'stackSize', atLeast: 2 }],
  },
  {
    id: 'delete',
    kind: 'practice',
    targets: ['editor'],
    howTo: 'delete-block',
    title: 'Apagar um bloco',
    text: 'Apague um bloco: arraste para a lixeira, arraste de volta para as categorias ou clique nele e aperte Delete.',
    done: [{ type: 'blockRemoved' }],
  },
  {
    id: 'pseudocode',
    kind: 'practice',
    targets: ['side'],
    howTo: 'open-pseudocode',
    title: 'Pseudocódigo',
    text: 'Abra a aba Pseudocódigo: ela mostra o seu programa escrito em texto.',
    done: [{ type: 'tabOpened', tab: 'pseudocode' }],
  },
  {
    id: 'run-stop',
    kind: 'practice',
    targets: ['editor', 'execution'],
    howTo: 'run-stop',
    title: 'Executar e Parar',
    text: 'Clique em Executar e observe o robô.',
    done: [{ type: 'run' }, { type: 'stop' }],
    followUps: ['Agora, enquanto o robô anda, clique em Parar: a fazenda volta ao início.'],
    notices: { success: EARLY_FINISH, error: EARLY_FINISH },
  },
  {
    id: 'step-mode',
    kind: 'practice',
    targets: ['execution'],
    howTo: 'step-mode',
    title: 'Passo a passo',
    text: 'Ligue Passo a passo.',
    done: [{ type: 'stepModeOn' }, { type: 'stepped' }],
    followUps: ['Agora clique em Próximo: o robô faz um bloco por vez e o bloco atual fica destacado.'],
  },
  {
    id: 'hints',
    kind: 'practice',
    targets: ['side'],
    howTo: 'hints',
    title: 'Dicas',
    text: 'Se travar, abra a aba Dicas.',
    done: [{ type: 'tabOpened', tab: 'hints' }, { type: 'hintRevealed' }],
    followUps: ['Clique em "Pedir dica" para ver a primeira dica.'],
  },
  {
    id: 'experiment',
    kind: 'practice',
    targets: ['editor', 'execution'],
    howTo: 'error-experiment',
    title: 'Experimento: andar demais',
    text: 'E se o robô andar demais? Deixe três "mover para frente" e depois "colher planta" (categoria Agricultura). Desligue Passo a passo e clique em Executar.',
    done: [{ type: 'error' }],
    notices: {
      success: 'Seu programa já colheu a planta! Para o experimento, deixe três "mover para frente" antes de "colher planta" e execute de novo.',
    },
  },
  {
    id: 'console',
    kind: 'tour',
    targets: ['side'],
    onEnterTab: 'console',
    title: 'Console',
    text: 'O Console explica o que deu errado: o robô bateu na pedra. Sempre leia o Console quando algo der errado.',
  },
  {
    id: 'fix',
    kind: 'practice',
    targets: ['editor', 'execution'],
    howTo: 'fix',
    title: 'Corrigir o programa',
    text: 'Remova um "mover para frente" e execute de novo para colher a planta.',
    done: [{ type: 'success' }],
  },
  {
    id: 'hud-actions',
    kind: 'tour',
    targets: ['hud-actions'],
    prefer: 'bottom',
    title: 'Ajuda, Configurações e Sair',
    text: 'Ajuda reabre o objetivo da fase, Configurações ajusta som e visual, e Sair volta para as missões.',
  },
  {
    id: 'done',
    kind: 'outro',
    title: 'Treinamento concluído!',
    text: 'Você montou, executou, parou e corrigiu um programa. Agora é hora das missões.',
  },
]
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/features/tutorial/tutorialScript.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/tutorial/tutorialTypes.ts src/features/tutorial/tutorialScript.ts src/features/tutorial/tutorialScript.test.ts
git commit -m "feat(tutorial): 15-step tutorial script with practice conditions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 1.2: Machine and signal bus

**Files:**
- Rewrite: `src/features/tutorial/tutorialMachine.ts`, `src/features/tutorial/tutorialMachine.test.ts`
- Create: `src/features/tutorial/signalBus.ts`, `src/features/tutorial/signalBus.test.ts`

**Interfaces:**
- Consumes: `TUTORIAL_STEPS`, `TutorialSignal`, `TutorialCondition` (Task 1.1).
- Produces:
  - `interface TutorialProgress { index: number; partial: number; notice: string | null }`
  - `TUTORIAL_START: TutorialProgress`
  - `advanceTutorial(progress: TutorialProgress, signal: TutorialSignal): TutorialProgress`
  - `nextTutorial(progress: TutorialProgress): TutorialProgress`
  - `previousTutorial(progress: TutorialProgress): TutorialProgress`
  - `statusSignal(previous: ExecutionStatus, snapshot: ExecutionSnapshot): TutorialSignal | null`
  - `createSignalBus<T>(): SignalBus<T>` with `emit(value: T): void` and `subscribe(listener: (value: T) => void): () => void`

Note: the old `TutorialOverlay.tsx` imports the old machine API and will not compile after this task. Delete `src/features/tutorial/TutorialOverlay.test.tsx` here and replace `TutorialOverlay.tsx` with a placeholder export that renders nothing so the app keeps compiling until Task 4.1:
```tsx
export function TutorialOverlay(_props: Record<string, unknown>) {
  return null
}
```
and in `src/features/gameplay/GameplayPage.tsx` leave the call site as is (props are ignored). Task 4.1 replaces both.

- [ ] **Step 1: Write the failing tests**

`src/features/tutorial/tutorialMachine.test.ts`:
```ts
import { advanceTutorial, nextTutorial, previousTutorial, statusSignal, TUTORIAL_START, type TutorialProgress } from '@/features/tutorial/tutorialMachine'
import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'
import type { TutorialSignal } from '@/features/tutorial/tutorialTypes'
import type { ExecutionSnapshot } from '@/game/execution/types'

const indexOf = (id: string) => TUTORIAL_STEPS.findIndex((step) => step.id === id)
const at = (id: string, partial = 0): TutorialProgress => ({ index: indexOf(id), partial, notice: null })
const feed = (progress: TutorialProgress, signals: TutorialSignal[]) => signals.reduce(advanceTutorial, progress)

describe('tutorial machine', () => {
  it('moves through intro and tour steps only with Próximo', () => {
    expect(nextTutorial(TUTORIAL_START).index).toBe(1)
    expect(advanceTutorial(at('goal'), { type: 'blockAdded' })).toEqual(at('goal'))
    expect(nextTutorial(at('goal')).index).toBe(indexOf('farm'))
  })

  it('ignores Próximo on practice steps and on the last step', () => {
    expect(nextTutorial(at('add'))).toEqual(at('add'))
    expect(nextTutorial(at('done'))).toEqual(at('done'))
  })

  it('completes each practice step with its own signal', () => {
    expect(advanceTutorial(at('add'), { type: 'blockAdded' }).index).toBe(indexOf('snap'))
    expect(advanceTutorial(at('snap'), { type: 'stackSize', size: 1 })).toEqual(at('snap'))
    expect(advanceTutorial(at('snap'), { type: 'stackSize', size: 2 }).index).toBe(indexOf('delete'))
    expect(advanceTutorial(at('delete'), { type: 'blockRemoved' }).index).toBe(indexOf('pseudocode'))
    expect(advanceTutorial(at('pseudocode'), { type: 'tabOpened', tab: 'hints' })).toEqual(at('pseudocode'))
    expect(advanceTutorial(at('pseudocode'), { type: 'tabOpened', tab: 'pseudocode' }).index).toBe(indexOf('run-stop'))
    expect(advanceTutorial(at('experiment'), { type: 'error' }).index).toBe(indexOf('console'))
    expect(advanceTutorial(at('fix'), { type: 'success' }).index).toBe(indexOf('hud-actions'))
  })

  it('keeps partial progress for ordered conditions', () => {
    const halfway = advanceTutorial(at('run-stop'), { type: 'run' })
    expect(halfway).toEqual(at('run-stop', 1))
    expect(advanceTutorial(at('run-stop'), { type: 'stop' })).toEqual(at('run-stop'))
    expect(advanceTutorial(halfway, { type: 'stop' }).index).toBe(indexOf('step-mode'))
    expect(feed(at('step-mode'), [{ type: 'stepModeOn' }, { type: 'stepped' }]).index).toBe(indexOf('hints'))
    expect(feed(at('hints'), [{ type: 'tabOpened', tab: 'hints' }, { type: 'hintRevealed' }]).index).toBe(indexOf('experiment'))
  })

  it('explains an early finish at Executar e Parar and starts the step over', () => {
    const finished = feed(at('run-stop'), [{ type: 'run' }, { type: 'error' }])
    expect(finished.index).toBe(indexOf('run-stop'))
    expect(finished.partial).toBe(0)
    expect(finished.notice).toContain('terminou antes')
    const cleared = advanceTutorial(finished, { type: 'run' })
    expect(cleared).toEqual(at('run-stop', 1))
  })

  it('does not skip ahead when the mission succeeds during the experiment', () => {
    const early = advanceTutorial(at('experiment'), { type: 'success' })
    expect(early.index).toBe(indexOf('experiment'))
    expect(early.notice).toContain('já colheu')
    expect(advanceTutorial(at('add'), { type: 'success' })).toEqual(at('add'))
  })

  it('goes back one step and clears partial progress and notices', () => {
    expect(previousTutorial({ index: indexOf('run-stop'), partial: 1, notice: 'x' })).toEqual(at('pseudocode'))
    expect(previousTutorial(TUTORIAL_START)).toEqual(TUTORIAL_START)
  })
})

describe('statusSignal', () => {
  const snap = (status: ExecutionSnapshot['status'], success = false) =>
    ({ status, validation: status === 'finished' ? { success, objectives: [], constraints: [] } : null }) as unknown as ExecutionSnapshot

  it('turns execution status changes into signals', () => {
    expect(statusSignal('idle', snap('running'))).toEqual({ type: 'run' })
    expect(statusSignal('running', snap('idle'))).toEqual({ type: 'stop' })
    expect(statusSignal('paused', snap('idle'))).toEqual({ type: 'stop' })
    expect(statusSignal('running', snap('failed'))).toEqual({ type: 'error' })
    expect(statusSignal('running', snap('finished', true))).toEqual({ type: 'success' })
    expect(statusSignal('running', snap('finished', false))).toEqual({ type: 'error' })
    expect(statusSignal('running', snap('running'))).toBeNull()
  })
})
```

`src/features/tutorial/signalBus.test.ts`:
```ts
import { createSignalBus } from '@/features/tutorial/signalBus'

describe('createSignalBus', () => {
  it('delivers values to current subscribers only', () => {
    const bus = createSignalBus<number>()
    const seen: number[] = []
    const stop = bus.subscribe((value) => seen.push(value))
    bus.emit(1)
    stop()
    bus.emit(2)
    expect(seen).toEqual([1])
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/tutorial/tutorialMachine.test.ts src/features/tutorial/signalBus.test.ts`
Expected: FAIL — `TUTORIAL_START`/`createSignalBus` not exported.

- [ ] **Step 3: Implement**

`src/features/tutorial/tutorialMachine.ts`:
```ts
import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'
import type { TutorialCondition, TutorialSignal } from '@/features/tutorial/tutorialTypes'
import type { ExecutionSnapshot, ExecutionStatus } from '@/game/execution/types'

export interface TutorialProgress {
  index: number
  partial: number
  notice: string | null
}

export const TUTORIAL_START: TutorialProgress = { index: 0, partial: 0, notice: null }

const LAST_INDEX = TUTORIAL_STEPS.length - 1

function matches(condition: TutorialCondition, signal: TutorialSignal): boolean {
  if (condition.type !== signal.type) return false
  if (condition.type === 'stackSize' && signal.type === 'stackSize') return signal.size >= condition.atLeast
  if (condition.type === 'tabOpened' && signal.type === 'tabOpened') return signal.tab === condition.tab
  return true
}

export function advanceTutorial(progress: TutorialProgress, signal: TutorialSignal): TutorialProgress {
  const step = TUTORIAL_STEPS[progress.index]
  if (!step || step.kind !== 'practice') return progress
  const condition = step.done[progress.partial]
  if (condition && matches(condition, signal)) {
    const partial = progress.partial + 1
    if (partial >= step.done.length) return { index: Math.min(progress.index + 1, LAST_INDEX), partial: 0, notice: null }
    return { index: progress.index, partial, notice: null }
  }
  const notice = step.notices?.[signal.type]
  if (notice) return { index: progress.index, partial: 0, notice }
  return progress
}

export function nextTutorial(progress: TutorialProgress): TutorialProgress {
  const step = TUTORIAL_STEPS[progress.index]
  if (!step || step.kind === 'practice' || progress.index >= LAST_INDEX) return progress
  return { index: progress.index + 1, partial: 0, notice: null }
}

export function previousTutorial(progress: TutorialProgress): TutorialProgress {
  return { index: Math.max(0, progress.index - 1), partial: 0, notice: null }
}

export function statusSignal(previous: ExecutionStatus, snapshot: ExecutionSnapshot): TutorialSignal | null {
  const next = snapshot.status
  if (previous === next) return null
  if (next === 'running') return previous === 'paused' ? null : { type: 'run' }
  if (next === 'idle' && (previous === 'running' || previous === 'paused')) return { type: 'stop' }
  if (next === 'failed') return { type: 'error' }
  if (next === 'finished') return snapshot.validation?.success ? { type: 'success' } : { type: 'error' }
  return null
}
```

`src/features/tutorial/signalBus.ts`:
```ts
export interface SignalBus<T> {
  emit: (value: T) => void
  subscribe: (listener: (value: T) => void) => () => void
}

export function createSignalBus<T>(): SignalBus<T> {
  const listeners = new Set<(value: T) => void>()
  return {
    emit: (value) => {
      for (const listener of [...listeners]) listener(value)
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
```

Replace `src/features/tutorial/TutorialOverlay.tsx` with the placeholder from the note above and delete `src/features/tutorial/TutorialOverlay.test.tsx` (`git rm`).

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/features/tutorial && npx tsc --noEmit -p .`
Expected: PASS; no type errors.

- [ ] **Step 5: Commit**

```bash
git add -A src/features/tutorial
git commit -m "feat(tutorial): pure machine with ordered conditions, notices and a signal bus

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
