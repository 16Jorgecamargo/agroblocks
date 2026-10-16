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
const BAR_COLUMN: TutorialTarget[] = ['farm']

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
  const [column] = useTargetRects(BAR_COLUMN)
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
          centerX={column ? column.x + column.width / 2 : null}
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
