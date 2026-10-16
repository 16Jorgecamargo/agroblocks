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
