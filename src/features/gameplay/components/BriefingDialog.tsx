import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/icons/Icon'
import { describeConstraint, describeObjective } from '@/game/missions/goals'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import { formatResource } from '@/features/gameplay/gameplayLogic'

interface BriefingDialogProps {
  mission: MissionDefinition
  onStart: () => void
  onDemo: () => void
}

export function BriefingDialog({ mission, onStart, onDemo }: BriefingDialogProps) {
  const title = mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`
  const { resources } = mission
  return (
    <Modal title={title} onClose={onStart} className="briefing">
      <p className="briefing__concept">
        <Icon name="bulb" size={18} /> Conceito: <strong>{CONCEPT_LABELS[mission.concept]}</strong>
      </p>
      <p>{mission.briefing.conceptIntro}</p>
      <h3 className="briefing__heading">Objetivo</h3>
      <p>{mission.briefing.goalText}</p>
      <ul className="briefing__list">
        {mission.objectives.map((objective, index) => (
          <li key={index}>
            <Icon name="flag" size={16} /> {describeObjective(objective)}
          </li>
        ))}
        {(mission.constraints ?? []).map((constraint, index) => (
          <li key={`c-${index}`}>
            <Icon name="lock" size={16} /> {describeConstraint(constraint)}
          </li>
        ))}
      </ul>
      <p className="briefing__resources">
        Recursos iniciais: sementes {formatResource(resources.seeds)} · água {formatResource(resources.water)} · energia{' '}
        {formatResource(resources.energy)}
      </p>
      <p className="briefing__reminder">O objetivo é entender o algoritmo, não terminar rápido. Teste, observe e corrija.</p>
      <div className="briefing__actions">
        {mission.briefing.demo && (
          <button type="button" className="button" onClick={onDemo}>
            <Icon name="eye" /> Ver demonstração
          </button>
        )}
        <button type="button" className="button button--primary" onClick={onStart}>
          Começar
        </button>
      </div>
    </Modal>
  )
}
