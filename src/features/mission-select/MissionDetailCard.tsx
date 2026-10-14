import { useNavigate } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { objectiveCells } from '@/features/gameplay/gameplayLogic'
import { lockReason } from '@/features/mission-select/missionMapLayout'
import { CONCEPT_LABELS, type MissionDefinition } from '@/game/missions/missionTypes'
import type { MissionProgress } from '@/game/progress/types'
import { createInitialState } from '@/game/world/createInitialState'
import { Grid2D } from '@/render/grid2d/Grid2D'

const STATUS_TEXT = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' } as const

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3].map((position) => (
        <span key={position} className={position <= value ? 'stars__on' : 'stars__off'} aria-hidden="true">
          <Icon name="star" size={18} />
        </span>
      ))}
    </span>
  )
}

export function MissionDetailCard({ mission, progress }: { mission: MissionDefinition; progress: MissionProgress | undefined }) {
  const navigate = useNavigate()
  const status = progress?.status ?? 'locked'
  const title = mission.tutorial ? mission.title : `Fase ${mission.order} - ${mission.title}`
  const best = progress?.bestResult
  return (
    <section className="mission-detail card" aria-label={title}>
      <div className="mission-detail__preview" aria-hidden="true">
        <Grid2D state={createInitialState(mission)} highlightCells={objectiveCells(mission)} failed={false} />
      </div>
      <p className="mission-detail__number">{mission.tutorial ? 'Treinamento' : `Fase ${mission.order}`}</p>
      <h2 className="mission-detail__title">{mission.title}</h2>
      <p>{mission.briefing.goalText}</p>
      <p className="mission-detail__concept">
        <Icon name="bulb" size={18} />
        <span>
          Conceito de programação
          <strong>{CONCEPT_LABELS[mission.concept]}</strong>
        </span>
      </p>
      <div className="mission-detail__meta">
        <span>Dificuldade</span>
        <Stars value={mission.difficulty} label={`Dificuldade ${mission.difficulty} de 3`} />
      </div>
      <p className={`mission-detail__status mission-detail__status--${status}`}>
        <Icon name={status === 'completed' ? 'check' : status === 'locked' ? 'lock' : 'play'} size={16} /> {STATUS_TEXT[status]}
        {progress && progress.attempts > 0 && ` · ${progress.attempts} tentativa(s)`}
      </p>
      <p className="mission-detail__best">
        {best ? (
          <>
            Melhor resultado: <Stars value={best.efficiencyStars} label={`Eficiência ${best.efficiencyStars} de 3`} /> · {best.actions} comandos ·{' '}
            {best.blocks} blocos
          </>
        ) : (
          'Ainda sem resultado.'
        )}
      </p>
      {status === 'locked' && <p className="mission-detail__lock">{lockReason(mission.order)}</p>}
      <button type="button" className="button button--primary mission-detail__start" disabled={status === 'locked'} onClick={() => navigate(`/jogar/${mission.id}`)}>
        {status === 'completed' ? 'Jogar de novo' : 'Iniciar fase'}
      </button>
    </section>
  )
}
