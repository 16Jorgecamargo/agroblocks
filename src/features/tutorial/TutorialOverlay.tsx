import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { advanceTutorial, statusSignal, TUTORIAL_STEPS, type TutorialSignal } from '@/features/tutorial/tutorialMachine'
import type { ExecutionSnapshot } from '@/game/execution/types'
import { EASINGS } from '@/motion/easings'
import { DURATIONS, NUDGE, overshoot, PRESSABLE } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import './TutorialOverlay.css'

interface TutorialOverlayProps {
  snapshot: ExecutionSnapshot
  blockEvent: { kind: 'added' | 'removed'; id: number } | null
}

export function TutorialOverlay({ snapshot, blockEvent }: TutorialOverlayProps) {
  const { ambient } = useMotionPrefs()
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

  const done = index >= TUTORIAL_STEPS.length
  const step = done ? null : TUTORIAL_STEPS[index]
  const waiting = step?.waitFor != null
  const next = () => setIndex((current) => current + 1)

  if (done) {
    return (
      <motion.div className="tutorial-bubble tutorial-bubble--done" role="status" variants={overshoot} initial="hidden" animate="visible">
        <strong>Treinamento concluído!</strong>
        <p>Você montou, executou, pausou e corrigiu um programa. Agora é hora das missões.</p>
        <motion.span {...PRESSABLE} style={{ display: 'inline-block' }}>
          <Link className="game-button game-button--primary game-button--md" to="/missoes">
            Ir para as missões
          </Link>
        </motion.span>
      </motion.div>
    )
  }

  return (
    <div className="tutorial" role="region" aria-label="Tutorial">
      <motion.div className="tutorial__banner" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <span className="tutorial__title">Tutorial</span>
        <span className="tutorial__progress">
          <span className="tutorial__count">
            {index + 1}/{TUTORIAL_STEPS.length}
          </span>
          <span className="tutorial__dots" aria-hidden="true">
            {TUTORIAL_STEPS.map((item, position) => (
              <motion.span
                key={item.id}
                className={position < index ? 'is-done' : position === index ? 'is-current' : ''}
                animate={position === index && ambient ? { y: [0, -4, 0] } : { y: 0 }}
                transition={position === index && ambient ? { duration: DURATIONS.tutorialDot, repeat: Infinity, ease: EASINGS.easeOutCubic } : { duration: DURATIONS.quickExit }}
              />
            ))}
          </span>
        </span>
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        {step && (
          <motion.div
            key={step.id}
            className="tutorial-bubble"
            aria-live="polite"
            variants={overshoot}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: 12, transition: { duration: DURATIONS.quickExit } }}
          >
            <p className="tutorial-bubble__text">
              {waiting && (
                <motion.span
                  className="tutorial-bubble__arrow"
                  aria-hidden="true"
                  animate={ambient ? NUDGE.keyframes : undefined}
                  transition={ambient ? { ...NUDGE.options, repeat: Infinity, repeatDelay: DURATIONS.nudgeRepeatDelay } : undefined}
                >
                  ➜
                </motion.span>
              )}
              {step.text}
            </p>
            {waiting && <p className="tutorial-bubble__waiting">Faça a ação para continuar.</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="tutorial__bar">
        <GameButton
          tone="dark"
          icon="back"
          className="tutorial__square"
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
          disabled={index === 0}
          aria-label="Passo anterior"
        />
        <GameButton tone="primary" size="lg" className="tutorial__next" disabled={waiting} onClick={next}>
          Próximo
        </GameButton>
        <GameButton tone="dark" icon="forward" className="tutorial__square" disabled={waiting} onClick={next} aria-label="Avançar passo" />
      </div>
    </div>
  )
}
