import { motion } from 'motion/react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { Icon } from '@/components/icons/Icon'
import { describeConstraint, describeObjective } from '@/game/missions/goals'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import { formatResource } from '@/features/gameplay/gameplayLogic'
import { questBanner, staggerContainer, staggerItem } from '@/motion/presets'
import { EASINGS } from '@/motion/easings'
import { useMotionPrefs } from '@/motion/useMotionPrefs'

interface BriefingDialogProps {
  open: boolean
  mission: MissionDefinition
  onStart: () => void
  onDemo: () => void
}

export function BriefingDialog({ open, mission, onStart, onDemo }: BriefingDialogProps) {
  const { ambient } = useMotionPrefs()
  const title = mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`
  const { resources } = mission
  return (
    <GameDialog open={open} title={title} icon="flag" tone="success" onClose={onStart}>
      <DialogSection>
        <motion.p className="briefing__concept" variants={questBanner}>
          <Icon name="bulb" size={18} /> Conceito: <strong>{CONCEPT_LABELS[mission.concept]}</strong>
        </motion.p>
      </DialogSection>
      <DialogSection>
        <p>{mission.briefing.conceptIntro}</p>
      </DialogSection>
      <DialogSection>
        <h3 className="briefing__heading">Objetivo</h3>
        <p>{mission.briefing.goalText}</p>
        <motion.ul className="briefing__list" variants={staggerContainer(0.08, 0.2)}>
          {mission.objectives.map((objective, index) => (
            <motion.li key={index} variants={staggerItem}>
              <Icon name="flag" size={16} /> {describeObjective(objective)}
            </motion.li>
          ))}
          {(mission.constraints ?? []).map((constraint, index) => (
            <motion.li key={`c-${index}`} variants={staggerItem}>
              <Icon name="lock" size={16} /> {describeConstraint(constraint)}
            </motion.li>
          ))}
        </motion.ul>
      </DialogSection>
      <DialogSection>
        <p className="briefing__resources">
          Recursos iniciais: sementes {formatResource(resources.seeds)} · água {formatResource(resources.water)} · energia {formatResource(resources.energy)}
        </p>
        <p className="briefing__reminder">O objetivo é entender o algoritmo, não terminar rápido. Teste, observe e corrija.</p>
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
          transition={ambient ? { duration: 1.6, repeat: Infinity, ease: EASINGS.easeOutCubic } : undefined}
        >
          <GameButton tone="primary" size="lg" icon="play" onClick={onStart}>
            Começar
          </GameButton>
        </motion.span>
      </DialogSection>
    </GameDialog>
  )
}
