import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { advanceTutorial, statusSignal, TUTORIAL_STEPS, type TutorialSignal } from '@/features/tutorial/tutorialMachine'
import type { ExecutionSnapshot } from '@/game/execution/types'
import './TutorialOverlay.css'

interface TutorialOverlayProps {
  snapshot: ExecutionSnapshot
  blockEvent: { kind: 'added' | 'removed'; id: number } | null
}

export function TutorialOverlay({ snapshot, blockEvent }: TutorialOverlayProps) {
  const [index, setIndex] = useState(0)
  const previousStatus = useRef(snapshot.status)
  const lastBlockEvent = useRef<number | null>(null)

  const signal = (value: TutorialSignal) => setIndex((current) => advanceTutorial(current, value))

  useEffect(() => {
    const derived = statusSignal(previousStatus.current, snapshot)
    previousStatus.current = snapshot.status
    if (derived) signal(derived)
  }, [snapshot])

  useEffect(() => {
    if (!blockEvent || lastBlockEvent.current === blockEvent.id) return
    lastBlockEvent.current = blockEvent.id
    signal(blockEvent.kind === 'added' ? 'blockAdded' : 'blockRemoved')
  }, [blockEvent])

  if (index >= TUTORIAL_STEPS.length) {
    return (
      <div className="tutorial-bubble tutorial-bubble--done" role="status">
        <strong>Treinamento concluído!</strong>
        <p>Você montou, executou, pausou e corrigiu um programa. Agora é hora das missões.</p>
        <Link className="button button--primary" to="/missoes">
          Ir para as missões
        </Link>
      </div>
    )
  }

  const step = TUTORIAL_STEPS[index]
  return (
    <div className="tutorial-bubble" role="region" aria-label="Tutorial" aria-live="polite">
      <div className="tutorial-bubble__top">
        <span className="tutorial-bubble__count">
          {index + 1}/{TUTORIAL_STEPS.length}
        </span>
        <span className="tutorial-bubble__dots" aria-hidden="true">
          {TUTORIAL_STEPS.map((item, position) => (
            <span key={item.id} className={position <= index ? 'is-done' : ''} />
          ))}
        </span>
      </div>
      <p className="tutorial-bubble__text">{step.text}</p>
      {step.waitFor && <p className="tutorial-bubble__waiting">Faça a ação para continuar.</p>}
      <div className="tutorial-bubble__actions">
        <button type="button" className="button button--ghost" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0} aria-label="Passo anterior">
          <Icon name="back" />
        </button>
        <button type="button" className="button button--primary" disabled={step.waitFor !== null} onClick={() => setIndex((current) => current + 1)}>
          Próximo
        </button>
      </div>
    </div>
  )
}
