import { motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'

interface TutorialBarProps {
  index: number
  total: number
  practice: boolean
  centerX: number | null
  onPrevious: () => void
  onNext: () => void
  onShowHowTo: () => void
  onSkip: () => void
}

export function TutorialBar({ index, total, practice, centerX, onPrevious, onNext, onShowHowTo, onSkip }: TutorialBarProps) {
  return (
    <motion.div
      className="tutorial-bar"
      role="toolbar"
      aria-label="Tutorial"
      style={{ left: centerX === null ? '50%' : `${centerX}px` }}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <GameButton tone="dark" icon="back" onClick={onPrevious} disabled={index === 0} aria-label="Passo anterior" />
      <GameButton tone="ghost" className="tutorial-bar__skip" onClick={onSkip}>
        Pular tutorial
      </GameButton>
      <span className="tutorial-bar__progress">
        <span data-testid="tutorial-progress">
          {index + 1}/{total}
        </span>
        <span className="tutorial-bar__meter" aria-hidden="true">
          <span className="tutorial-bar__meter-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
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
