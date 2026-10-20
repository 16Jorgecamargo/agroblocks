import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { Icon, type IconName } from '@/components/icons/Icon'
import { describeConstraint } from '@/game/missions/goals'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import { formatResource } from '@/features/gameplay/gameplayLogic'
import { visibleResources, type HudResource } from '@/features/gameplay/hudLogic'
import { DURATIONS, questBanner, softRise, staggerContainer, staggerItem } from '@/motion/presets'
import { EASINGS } from '@/motion/easings'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

interface BriefingDialogProps {
  open: boolean
  mission: MissionDefinition
  onStart: () => void
  onDemo: () => void
}

const RESOURCE_CHIPS: Record<Exclude<HudResource, 'harvest'>, { icon: IconName; label: string }> = {
  seeds: { icon: 'seed', label: 'Sementes' },
  water: { icon: 'drop', label: 'Água' },
  energy: { icon: 'bolt', label: 'Energia' },
}

export function BriefingDialog({ open, mission, onStart, onDemo }: BriefingDialogProps) {
  const { ambient } = useMotionPrefs()
  const [showConcept, setShowConcept] = useState(false)
  const title = mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`
  const resources = visibleResources(mission).filter((resource): resource is Exclude<HudResource, 'harvest'> => resource !== 'harvest')
  const constraints = mission.constraints ?? []
  const blockLimit = mission.rules.maxBlocks
  const hasLimits = constraints.length > 0 || blockLimit !== undefined

  return (
    <GameDialog open={open} title={title} icon="flag" tone="success" onClose={onStart}>
      <DialogSection>
        <div className="briefing__goal">
          <span className="briefing__goal-icon" aria-hidden="true">
            <Icon name="flag" size={26} />
          </span>
          <div>
            <h3 className="briefing__goal-title">Objetivo</h3>
            <p className="briefing__goal-text">{mission.briefing.goalText}</p>
          </div>
        </div>
      </DialogSection>
      {(hasLimits || resources.length > 0) && (
        <DialogSection>
          <div className="briefing__chips">
            {resources.length > 0 && (
              <motion.ul className="briefing__chip-list" aria-label="Recursos iniciais" variants={staggerContainer(0.06, 0.15)}>
                {resources.map((resource) => (
                  <motion.li key={resource} className={`briefing__chip briefing__chip--${resource}`} variants={staggerItem}>
                    <Icon name={RESOURCE_CHIPS[resource].icon} size={16} />
                    {RESOURCE_CHIPS[resource].label} <strong>{formatResource(mission.resources[resource])}</strong>
                  </motion.li>
                ))}
              </motion.ul>
            )}
            {hasLimits && (
              <ul className="briefing__chip-list" aria-label="Limites">
                {blockLimit !== undefined && (
                  <li className="briefing__chip briefing__chip--limit">
                    <Icon name="lock" size={16} /> Limite: {blockLimit} blocos
                  </li>
                )}
                {constraints.map((constraint, index) => (
                  <li key={index} className="briefing__chip briefing__chip--limit">
                    <Icon name="lock" size={16} /> {describeConstraint(constraint)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogSection>
      )}
      <DialogSection>
        <div className="briefing__concept-row">
          <motion.span className="briefing__concept" variants={questBanner}>
            <Icon name="bulb" size={16} /> {CONCEPT_LABELS[mission.concept]}
          </motion.span>
          <button type="button" className="briefing__more" aria-expanded={showConcept} onClick={() => setShowConcept((value) => !value)}>
            Sobre o conceito
          </button>
        </div>
        <AnimatePresence initial={false}>
          {showConcept && (
            <motion.p key="intro" className="briefing__intro" variants={softRise} initial="hidden" animate="visible" exit="hidden">
              {mission.briefing.conceptIntro}
            </motion.p>
          )}
        </AnimatePresence>
      </DialogSection>
      <DialogSection className="game-dialog__actions">
        {mission.briefing.demo && (
          <GameButton tone="secondary" icon="eye" onClick={onDemo}>
            Ver demonstração
          </GameButton>
        )}
        <motion.span
          className="briefing__start"
          animate={ambient ? { boxShadow: ['0 0 0 0 rgba(63,163,77,0.55)', '0 0 0 12px rgba(63,163,77,0)'] } : undefined}
          transition={ambient ? { duration: DURATIONS.glowPulse, repeat: Infinity, ease: EASINGS.easeOutCubic } : undefined}
        >
          <GameButton tone="primary" size="lg" icon="play" onClick={onStart}>
            Começar
          </GameButton>
        </motion.span>
      </DialogSection>
    </GameDialog>
  )
}
