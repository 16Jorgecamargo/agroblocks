# Phase 4 — Tutorial overlay and gameplay integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Read `plan_index.md` first (Global Constraints).

**Spec:** sections 3, 5, 7.

### Task 4.1: `TutorialOverlay` and `TutorialBar`

**Files:**
- Rewrite: `src/features/tutorial/TutorialOverlay.tsx`, `src/features/tutorial/TutorialOverlay.css`
- Create: `src/features/tutorial/TutorialBar.tsx`, `src/features/tutorial/TutorialOverlay.test.tsx`

**Interfaces:**
- Consumes: `TUTORIAL_STEPS` (1.1), `TUTORIAL_START`, `advanceTutorial`, `nextTutorial`, `previousTutorial`, `statusSignal` (1.2), `SignalBus` (1.2), `useTargetRects`, `TutorialSpotlight`, `TutorialCallout` (2.2), `HowToDialog` (3.3), `GameDialog`, `DialogSection`, `GameButton`.
- Produces:
  - `interface TutorialFacts { stackSize: number; stepMode: boolean }`
  - `TutorialOverlay(props: { snapshot: ExecutionSnapshot; bus: SignalBus<TutorialSignal>; facts: TutorialFacts; onSideTab: (tab: SideTab) => void; onExit: () => void })`
  - `TutorialBar(props: { index: number; total: number; practice: boolean; onPrevious: () => void; onNext: () => void; onShowHowTo: () => void; onSkip: () => void })` — `role="toolbar"` `aria-label="Tutorial"`, progress text `"{index + 1}/{total}"`

Behaviour:
- `intro`/`outro` steps render a `GameDialog` (tone `success`, icon `flag`) with the step title and text; intro button "Começar treinamento" → `nextTutorial`; outro button "Ir para as missões" → `onExit`. No bar, no spotlight.
- `tour` steps: spotlight on targets + callout + bar with "Próximo".
- `practice` steps: `HowToDialog` opens on entry; while it is open no spotlight/callout; after "Praticar", spotlight + callout + bar with "Ver animação" (no "Próximo").
- On entering any step: call `onSideTab(step.onEnterTab)` when set; then feed `{ type: 'stackSize', size: facts.stackSize }` and, if `facts.stepMode`, `{ type: 'stepModeOn' }` (Review Focus 2).
- Bus signals and `statusSignal` from snapshot changes go through `advanceTutorial`.
- The callout text is `step.followUps[partial - 1]` when `partial > 0`, otherwise `step.text`.
- "Pular tutorial" opens a `GameDialog` (tone `warning`, icon `flag`, title "Sair do treinamento?") with text "Você pode voltar ao treinamento depois, pela lista de missões." and buttons "Continuar treinamento" (closes) and "Sair do treinamento" (`onExit`).

- [ ] **Step 1: Write the failing test**

`src/features/tutorial/TutorialOverlay.test.tsx`:
```tsx
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createSignalBus } from '@/features/tutorial/signalBus'
import { TutorialOverlay, type TutorialFacts } from '@/features/tutorial/TutorialOverlay'
import type { SideTab, TutorialSignal } from '@/features/tutorial/tutorialTypes'
import type { ExecutionSnapshot } from '@/game/execution/types'

const snap = (status: ExecutionSnapshot['status'], success = false) =>
  ({ status, validation: status === 'finished' ? { success, objectives: [], constraints: [] } : null }) as unknown as ExecutionSnapshot

function setup(facts: TutorialFacts = { stackSize: 0, stepMode: false }) {
  const bus = createSignalBus<TutorialSignal>()
  const onSideTab = vi.fn<(tab: SideTab) => void>()
  const onExit = vi.fn()
  const view = render(<TutorialOverlay snapshot={snap('idle')} bus={bus} facts={facts} onSideTab={onSideTab} onExit={onExit} />)
  const rerender = (snapshot: ExecutionSnapshot, nextFacts = facts) =>
    view.rerender(<TutorialOverlay snapshot={snapshot} bus={bus} facts={nextFacts} onSideTab={onSideTab} onExit={onExit} />)
  const emit = (signal: TutorialSignal) => act(() => bus.emit(signal))
  return { bus, onSideTab, onExit, rerender, emit }
}

const progress = () => within(screen.getByRole('toolbar', { name: 'Tutorial' })).getByTestId('tutorial-progress').textContent
const practise = () => fireEvent.click(screen.getAllByRole('button', { name: 'Praticar' }).at(-1) as HTMLElement)

describe('TutorialOverlay', () => {
  it('runs the whole tutorial from welcome to the missions', () => {
    const { rerender, emit, onSideTab, onExit } = setup()
    expect(screen.getByRole('dialog', { name: 'Bem-vindo ao treinamento' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    expect(progress()).toBe('2/15')
    expect(screen.getByRole('dialog', { name: 'Objetivo da fase' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))

    expect(progress()).toBe('4/15')
    expect(screen.getByRole('dialog', { name: 'Como adicionar um bloco' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Próximo' })).not.toBeInTheDocument()
    practise()
    emit({ type: 'blockAdded' })
    expect(progress()).toBe('5/15')
    practise()
    emit({ type: 'stackSize', size: 2 })
    expect(progress()).toBe('6/15')
    practise()
    emit({ type: 'blockRemoved' })
    practise()
    emit({ type: 'tabOpened', tab: 'pseudocode' })
    expect(progress()).toBe('8/15')
    practise()
    rerender(snap('running'))
    expect(screen.getByRole('dialog', { name: 'Executar e Parar' })).toHaveTextContent('clique em Parar')
    rerender(snap('idle'))
    expect(progress()).toBe('9/15')
    practise()
    emit({ type: 'stepModeOn' })
    emit({ type: 'stepped' })
    practise()
    emit({ type: 'tabOpened', tab: 'hints' })
    emit({ type: 'hintRevealed' })
    expect(progress()).toBe('11/15')
    practise()
    rerender(snap('running'))
    rerender(snap('failed'))
    expect(progress()).toBe('12/15')
    expect(onSideTab).toHaveBeenLastCalledWith('console')
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    practise()
    rerender(snap('running'))
    rerender(snap('finished', true))
    expect(progress()).toBe('14/15')
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(screen.getByRole('dialog', { name: 'Treinamento concluído!' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para as missões' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('completes a step at once when its condition is already true on entry', () => {
    const { emit } = setup({ stackSize: 2, stepMode: false })
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    practise()
    emit({ type: 'blockAdded' })
    expect(progress()).toBe('6/15')
  })

  it('shows a notice when the run ends before Parar', () => {
    const { rerender, emit } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    for (let index = 0; index < 2; index += 1) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    practise()
    emit({ type: 'blockAdded' })
    practise()
    emit({ type: 'stackSize', size: 2 })
    practise()
    emit({ type: 'blockRemoved' })
    practise()
    emit({ type: 'tabOpened', tab: 'pseudocode' })
    practise()
    rerender(snap('running'))
    rerender(snap('failed'))
    expect(progress()).toBe('8/15')
    expect(screen.getByRole('dialog', { name: 'Executar e Parar' })).toHaveTextContent('terminou antes')
  })

  it('asks before skipping the tutorial', () => {
    const { onExit } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }))
    const confirm = screen.getByRole('dialog', { name: 'Sair do treinamento?' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'Continuar treinamento' }))
    expect(onExit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }))
    fireEvent.click(within(screen.getAllByRole('dialog', { name: 'Sair do treinamento?' }).at(-1) as HTMLElement).getByRole('button', { name: 'Sair do treinamento' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('goes back with Anterior', () => {
    setup()
    fireEventved' })
    practise()
    emit({ type: 'tabOpened', tab: 'pseudocode' })
    practise()
    rerender(snap('running'))
    rerender(snap('failed'))
    expect(progress()).toBe('8/15')
    expect(screen.getByRole('dialog', { name: 'Executar e Parar' })).toHaveTextContent('terminou antes')
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/tutorial/TutorialOverlay.test.tsx`
Expected: FAIL — `TutorialFacts` not exported / placeholder overlay renders nothing.

- [ ] **Step 3: Implement**

`src/features/tutorial/TutorialBar.tsx`:
```tsx
import { motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

interface TutorialBarProps {
  index: number
  total: number
  practice: boolean
  onPrevious: () => void
  onNext: () => void
  onShowHowTo: () => void
  onSkip: () => void
}

export function TutorialBar({ index, total, practice, onPrevious, onNext, onShowHowTo, onSkip }: TutorialBarProps) {
  const { ambient } = useMotionPrefs()
  return (
    <motion.div className="tutorial-bar" role="toolbar" aria-label="Tutorial" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <GameButton tone="dark" icon="back" onClick={onPrevious} disabled={index === 0} aria-label="Passo anterior" />
      <GameButton tone="ghost" className="tutorial-bar__skip" onClick={onSkip}>
        Pular tutorial
      </GameButton>
      <span className="tutorial-bar__progress">
        <span data-testid="tutorial-progress">
          {index + 1}/{total}
        </span>
        <span className="tutorial-bar__dots" aria-hidden="true">
          {Array.from({ length: total }, (_, position) => (
            <motion.span
              key={position}
              className={position < index ? 'is-done' : position === index ? 'is-current' : ''}
              animate={position === index && ambient ? { y: [0, -3, 0] } : { y: 0 }}
              transition={position === index && ambient ? { duration: DURATIONS.tutorialDot, repeat: Infinity, ease: EASINGS.easeOutCubic } : { duration: DURATIONS.quickExit }}
            />
          ))}
        </span>
      </span>
      {practice ? (
        <GameButton tone="secondary" icon="eye" onClick={onShowHowTo}>
          Ver animação
        </GameButton>
      ) : (
        <GameButton tone="primary" icon="forward" onClick={onNext}>
          Próximo
        </GameButton>
      )}
    </motion.div>
  )
}
```

`src/features/tutorial/TutorialOverlay.tsx`:
```tsx
import { useCallback, useEffect, useRef, useState } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { HowToDialog } from '@/features/tutorial/howto/HowToDialog'
import type { SignalBus } from '@/features/tutorial/signalBus'
import { TutorialBar } from '@/features/tutorial/TutorialBar'
import { TutorialCallout } from '@/features/tutorial/TutorialCallout'
import { advanceTutorial, nextTutorial, previousTutorial, statusSignal, TUTORIAL_START } from '@/features/tutorial/tutorialMachine'
import { TUTORIAL_STEPS } from '@/features/tutorial/tutorialScript'
import { TutorialSpotlight } from '@/features/tutorial/TutorialSpotlight'
import type { SideTab, TutorialSignal, TutorialTarget } from '@/features/tutorial/tutorialTypes'
import { useTargetRects } from '@/features/tutorial/useTargetRects'
import type { ExecutionSnapshot } from '@/game/execution/types'
import './TutorialOverlay.css'

export interface TutorialFacts {
  stackSize: number
  stepMode: boolean
}

interface TutorialOverlayProps {
  snapshot: ExecutionSnapshot
  bus: SignalBus<TutorialSignal>
  facts: TutorialFacts
  onSideTab: (tab: SideTab) => void
  onExit: () => void
}

const NO_TARGETS: TutorialTarget[] = []

export function TutorialOverlay({ snapshot, bus, facts, onSideTab, onExit }: TutorialOverlayProps) {
  const [progress, setProgress] = useState(TUTORIAL_START)
  const [howToOpen, setHowToOpen] = useState(false)
  const [confirmSkip, setConfirmSkip] = useState(false)
  const previousStatus = useRef(snapshot.status)
  const factsRef = useRef(facts)
  const sideTabRef = useRef(onSideTab)
  factsRef.current = facts
  sideTabRef.current = onSideTab

  const apply = useCallback((signal: TutorialSignal) => setProgress((current) => advanceTutorial(current, signal)), [])

  useEffect(() => bus.subscribe(apply), [bus, apply])

  useEffect(() => {
    const derived = statusSignal(previousStatus.current, snapshot)
    previousStatus.current = snapshot.status
    if (derived) apply(derived)
  }, [snapshot, apply])

  useEffect(() => {
    const step = TUTORIAL_STEPS[progress.index]
    if (step.onEnterTab) sideTabRef.current(step.onEnterTab)
    setHowToOpen(step.kind === 'practice')
    apply({ type: 'stackSize', size: factsRef.current.stackSize })
    if (factsRef.current.stepMode) apply({ type: 'stepModeOn' })
  }, [progress.index, apply])

  const step = TUTORIAL_STEPS[progress.index]
  const guided = step.kind === 'tour' || step.kind === 'practice'
  const targets = guided ? step.targets : NO_TARGETS
  const rects = useTargetRects(targets)
  const practice = step.kind === 'practice'
  const text = practice && progress.partial > 0 ? (step.followUps?.[progress.partial - 1] ?? step.text) : step.text
  const showGuide = guided && !(practice && howToOpen)

  return (
    <>
      {showGuide && <TutorialSpotlight rects={rects} />}
      {showGuide && (
        <TutorialCallout
          key={step.id}
          target={rects[0] ?? null}
          prefer={guided ? step.prefer : undefined}
          title={step.title}
          text={text}
          notice={progress.notice}
          practice={practice}
          onShowHowTo={() => setHowToOpen(true)}
        />
      )}
      {guided && (
        <TutorialBar
          index={progress.index}
          total={TUTORIAL_STEPS.length}
          practice={practice}
          onPrevious={() => setProgress(previousTutorial)}
          onNext={() => setProgress(nextTutorial)}
          onShowHowTo={() => setHowToOpen(true)}
          onSkip={() => setConfirmSkip(true)}
        />
      )}
      {practice && <HowToDialog open={howToOpen} howTo={step.howTo} onPractice={() => setHowToOpen(false)} />}
      <GameDialog open={step.kind === 'intro' || step.kind === 'outro'} title={step.title} icon="flag" tone="success">
        <DialogSection>
          <p className="tutorial-intro__text">{step.text}</p>
        </DialogSection>
        <DialogSection className="game-dialog__actions">
          {step.kind === 'intro' ? (
            <GameButton tone="primary" size="lg" icon="play" onClick={() => setProgress(nextTutorial)}>
              Começar treinamento
            </GameButton>
          ) : (
            <GameButton tone="primary" size="lg" icon="forward" onClick={onExit}>
              Ir para as missões
            </GameButton>
          )}
        </DialogSection>
      </GameDialog>
      <GameDialog open={confirmSkip} title="Sair do treinamento?" icon="flag" tone="warning" onClose={() => setConfirmSkip(false)}>
        <DialogSection>
          <p className="tutorial-intro__text">Você pode voltar ao treinamento depois, pela lista de missões.</p>
        </DialogSection>
        <DialogSection className="game-dialog__actions">
          <GameButton tone="secondary" onClick={() => setConfirmSkip(false)}>
            Continuar treinamento
          </GameButton>
          <GameButton tone="danger" onClick={onExit}>
            Sair do treinamento
          </GameButton>
        </DialogSection>
      </GameDialog>
    </>
  )
}
```

`src/features/tutorial/TutorialOverlay.css` (replace the whole file):
```css
.tutorial-spotlight {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgb(9 16 22 / 0.55);
  pointer-events: auto;
}

.tutorial-spotlight__ring {
  position: fixed;
  z-index: 91;
  border: 2px solid #f6c343;
  border-radius: 14px;
  box-shadow: 0 0 0 4px rgb(246 195 67 / 0.25);
  pointer-events: none;
}

.tutorial-callout {
  --arrow: 40px;
  position: fixed;
  z-index: 95;
  width: 340px;
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: 16px;
  background: #fffdf7;
  color: #1b2630;
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.3);
}

.tutorial-callout::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: inherit;
  transform: rotate(45deg);
}

.tutorial-callout--right::before {
  left: -8px;
  top: calc(var(--arrow) - 8px);
}

.tutorial-callout--left::before {
  right: -8px;
  top: calc(var(--arrow) - 8px);
}

.tutorial-callout--bottom::before {
  top: -8px;
  left: calc(var(--arrow) - 8px);
}

.tutorial-callout--top::before {
  bottom: -8px;
  left: calc(var(--arrow) - 8px);
}

.tutorial-callout__title {
  font-family: var(--font-display);
  font-size: var(--text-md);
}

.tutorial-callout__text {
  margin: 0;
  line-height: 1.45;
}

.tutorial-callout__notice {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: 10px;
  background: #fff3d6;
  color: #7a4f00;
  font-weight: 600;
}

.tutorial-callout__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.tutorial-callout__waiting {
  font-size: var(--text-sm);
  color: #6b7782;
}

.tutorial-bar {
  position: fixed;
  left: 50%;
  bottom: 16px;
  z-index: 96;
  translate: -50% 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: 16px;
  background: rgb(19 31 41 / 0.92);
  color: #ffffff;
  box-shadow: 0 12px 30px rgb(0 0 0 / 0.35);
}

.tutorial-bar__skip {
  color: #c9d2da;
}

.tutorial-bar__progress {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: var(--text-sm);
}

.tutorial-bar__dots {
  display: inline-flex;
  gap: 5px;
}

.tutorial-bar__dots span {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.3);
}

.tutorial-bar__dots span.is-done {
  background: rgb(92 191 79 / 0.7);
}

.tutorial-bar__dots span.is-current {
  background: #5cbf4f;
}

.tutorial-intro__text {
  margin: 0;
  line-height: 1.5;
}
```

GameDialog's backdrop uses `z-index: 100`, above the spotlight (90–96), so dialogs stay on top.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/features/tutorial && npx tsc --noEmit -p .`
Expected: PASS. `GameplayPage.tsx` still passes the old props (`snapshot`, `blockEvent`); typecheck fails there until Task 4.2 — if so, do Task 4.2 Step 3's GameplayPage changes before committing and commit both tasks together, ledgering the merge.

- [ ] **Step 5: Commit**

```bash
git add -A src/features/tutorial
git commit -m "feat(tutorial): overlay with intro, spotlight steps, how-to dialogs and bar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4.2: Gameplay integration

**Files:**
- Modify: `src/features/gameplay/GameplayPage.tsx`, `src/features/gameplay/components/GameHud.tsx`, `src/features/gameplay/components/ExecutionPanel.tsx`, `src/features/gameplay/GameplayPage.test.tsx`

**Interfaces:**
- Consumes: `TutorialOverlay`, `TutorialFacts` (4.1), `createSignalBus` (1.2), `TutorialSignal`, `SideTab` (1.1).

- [ ] **Step 1: Write the failing tests**

Append to the `describe` in `src/features/gameplay/GameplayPage.test.tsx` (it already has `renderAt` and fake timers; the BlocklyEditor is mocked):
```tsx
  it('opens the training with the tutorial welcome instead of the briefing', () => {
    renderAt('/jogar/m0-training')
    expect(screen.getByRole('dialog', { name: 'Bem-vindo ao treinamento' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Objetivo' })).not.toBeInTheDocument()
  })

  it('marks the real screen areas the tutorial points at', () => {
    renderAt('/jogar/m0-training')
    for (const target of ['hud-goal', 'hud-harvest', 'hud-actions', 'farm', 'editor', 'execution', 'side']) {
      expect(document.querySelector(`[data-tutorial="${target}"]`)).not.toBeNull()
    }
  })

  it('counts opening Dicas as the reveal when no hint can be revealed', () => {
    useProgressStore.setState((state) => ({
      save: { ...state.save, missions: { ...state.save.missions, 'm0-training': { ...state.save.missions['m0-training'], hintsUsed: 3 } } },
    }))
    renderAt('/jogar/m0-training')
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    for (let index = 0; index < 2; index += 1) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(screen.getByTestId('tutorial-progress')).toHaveTextContent('4/15')
  })
```

The third test only proves the tutorial reaches practice; the hint fallback itself is asserted by unit-testing the emitter helper below. Add a pure helper and its test:

`src/features/gameplay/tutorialSignals.ts`:
```ts
import type { SideTab, TutorialSignal } from '@/features/tutorial/tutorialTypes'

export function tabSignals(tab: SideTab, canRevealHint: boolean): TutorialSignal[] {
  const signals: TutorialSignal[] = [{ type: 'tabOpened', tab }]
  if (tab === 'hints' && !canRevealHint) signals.push({ type: 'hintRevealed' })
  return signals
}
```

`src/features/gameplay/tutorialSignals.test.ts`:
```ts
import { tabSignals } from '@/features/gameplay/tutorialSignals'

describe('tabSignals', () => {
  it('reports the opened tab', () => {
    expect(tabSignals('pseudocode', true)).toEqual([{ type: 'tabOpened', tab: 'pseudocode' }])
    expect(tabSignals('hints', true)).toEqual([{ type: 'tabOpened', tab: 'hints' }])
  })

  it('counts opening Dicas as a reveal when no more hints can be revealed', () => {
    expect(tabSignals('hints', false)).toEqual([{ type: 'tabOpened', tab: 'hints' }, { type: 'hintRevealed' }])
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/gameplay/GameplayPage.test.tsx src/features/gameplay/tutorialSignals.test.ts`
Expected: FAIL — no welcome dialog, no `data-tutorial`, helper missing.

- [ ] **Step 3: Implement**

`src/features/gameplay/components/GameHud.tsx`: add `data-tutorial="hud-goal"` to `<div className="game-hud__mission">`, `data-tutorial="hud-harvest"` to `<div className="game-hud__resources" …>`, `data-tutorial="hud-actions"` to `<div className="game-hud__actions">`.

`src/features/gameplay/components/ExecutionPanel.tsx`: add `data-tutorial="execution"` to the root `<section ref={scope} className="execution-panel" …>`.

`src/features/gameplay/GameplayPage.tsx`:
1. Imports: add `import { createSignalBus } from '@/features/tutorial/signalBus'`, `import type { SideTab, TutorialSignal } from '@/features/tutorial/tutorialTypes'`, `import { tabSignals } from '@/features/gameplay/tutorialSignals'`.
2. Replace `const [showBriefing, setShowBriefing] = useState(true)` with `const [showBriefing, setShowBriefing] = useState(!mission.tutorial)`.
3. Remove the `blockEvent` state and `blockEventId` ref; add:
```tsx
  const tutorialBus = useMemo(() => createSignalBus<TutorialSignal>(), [])
  const emitTutorial = useCallback(
    (signal: TutorialSignal) => {
      if (mission.tutorial) tutorialBus.emit(signal)
    },
    [mission.tutorial, tutorialBus],
  )
  const stackSize = session.program?.main.length ?? 0
  useEffect(() => {
    emitTutorial({ type: 'stackSize', size: stackSize })
  }, [stackSize, emitTutorial])
  const stepOnce = useCallback(() => {
    session.step()
    emitTutorial({ type: 'stepped' })
  }, [session, emitTutorial])
  const openSideTab = useCallback(
    (tab: string) => {
      setSideTab(tab)
      for (const signal of tabSignals(tab as SideTab, session.canReveal)) emitTutorial(signal)
    },
    [session.canReveal, emitTutorial],
  )
```
   (add `useCallback` to the React import).
4. `useGameplayShortcuts`: `run: () => (stepMode ? stepOnce() : session.run())`, `step: stepOnce`.
5. `BlocklyEditor` `onBlockEvent={(kind) => emitTutorial({ type: kind === 'added' ? 'blockAdded' : 'blockRemoved' })}`.
6. Editor section: add `data-tutorial="editor"`; farm section: add `data-tutorial="farm"`; side tabs div: `<div className="gameplay__side-tabs" data-tutorial="side">`.
7. Celebration: change `{succeeded && (` (the `motion.div` with `key="celebration"`) to `{succeeded && !mission.tutorial && (` and delete the `{mission.tutorial && <span> Você completou o treinamento.</span>}` line.
8. Remove `{mission.tutorial && <TutorialOverlay snapshot={snapshot} blockEvent={blockEvent} />}` from the farm section; after `<HarvestFlights />` add:
```tsx
      {mission.tutorial && (
        <TutorialOverlay
          snapshot={snapshot}
          bus={tutorialBus}
          facts={{ stackSize, stepMode }}
          onSideTab={(tab) => setSideTab(tab)}
          onExit={() => navigate('/missoes')}
        />
      )}
```
9. `ExecutionPanel`: `onStep={stepOnce}`, `onStepModeChange={(value) => { setStepMode(value); if (value) emitTutorial({ type: 'stepModeOn' }) }}`.
10. `PillTabs` for the side: `onChange={openSideTab}`.
11. `HintsPanel`: `onReveal={() => { session.revealHint(); emitTutorial({ type: 'hintRevealed' }) }}`.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx tsc --noEmit -p . && npx vitest run --maxWorkers=2`
Expected: all PASS. If an older GameplayPage test opened `m0-training` expecting the briefing "Começar" button, update it to click "Começar treinamento".

- [ ] **Step 5: Commit**

```bash
git add src/features/gameplay
git commit -m "feat(tutorial): wire tutorial signals and targets into gameplay

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
