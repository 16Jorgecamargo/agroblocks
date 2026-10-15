import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { Icon } from '@/components/icons/Icon'
import { HINT_LEVEL_LABELS } from '@/features/gameplay/gameplayLogic'
import { DURATIONS, HEARTBEAT, rowExpand } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

interface HintsPanelProps {
  hints: [string, string, string, string]
  revealed: number
  canReveal: boolean
  failedAttempts: number
  onReveal: () => void
}

export function HintsPanel({ hints, revealed, canReveal, failedAttempts, onReveal }: HintsPanelProps) {
  const { ambient } = useMotionPrefs()
  const initiallyRevealed = useRef(revealed)
  const lockedLast = revealed === 3 && failedAttempts < 2
  const attention = canReveal && failedAttempts >= 2 && ambient
  return (
    <div className="hints-panel">
      <p className="hints-panel__intro">
        Tente primeiro sozinho. As dicas vão da ideia geral até um exemplo parcial e ficam registradas para o professor.
      </p>
      <ol className="hints-panel__list">
        {hints.slice(0, revealed).map((hint, index) => (
          <motion.li key={index} className="hint" variants={rowExpand} initial={index < initiallyRevealed.current ? false : 'hidden'} animate="visible">
            <strong>
              <Icon name="bulb" size={16} /> {HINT_LEVEL_LABELS[index]}
            </strong>
            <span>{hint}</span>
          </motion.li>
        ))}
      </ol>
      <motion.div animate={attention ? HEARTBEAT.keyframes : { scale: 1 }} transition={attention ? HEARTBEAT.options : { duration: DURATIONS.quickExit }}>
        <GameButton tone="accent" icon="bulb" onClick={onReveal} disabled={!canReveal}>
          Pedir dica ({revealed}/4)
        </GameButton>
      </motion.div>
      <AnimatePresence>
        {lockedLast && (
          <motion.p
            className="hints-panel__lock"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, rotate: -8, transition: { duration: DURATIONS.tagExit } }}
          >
            <Icon name="lock" size={16} /> O exemplo parcial libera depois de 2 tentativas sem sucesso.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
