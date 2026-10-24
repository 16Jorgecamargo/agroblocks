import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { GameButton, GameLink } from '@/components/game/GameButton'
import { StarRow } from '@/components/game/StarRow'
import { Icon } from '@/components/icons/Icon'
import { assessmentPath } from '@/features/assessment/assessmentPath'
import { objectiveCells } from '@/features/gameplay/gameplayLogic'
import type { NodeState, TrailNode } from '@/features/mission-select/trailNodes'
import type { MissionProgress } from '@/game/progress/types'
import { ITEMS_PER_FORM } from '@/game/assessment/types'
import { MISSIONS_PER_WORLD, ROLE_LABELS, roleForSlot, type WorldDefinition } from '@/game/worlds/worldTypes'
import { createInitialState } from '@/game/world/createInitialState'
import { cardFlip } from '@/motion/presets'
import { Grid2D } from '@/render/grid2d/Grid2D'

const STATE_TEXT: Record<NodeState, string> = { done: 'Concluída', current: 'Próxima da trilha', open: 'Disponível', locked: 'Bloqueada' }

interface TrailCardProps {
  world: WorldDefinition
  node: TrailNode
  state: NodeState
  progress: MissionProgress | undefined
}

export function nodeTitle(node: TrailNode): string {
  if (node.kind === 'preTest') return 'Prova inicial'
  if (node.kind === 'postTest') return 'Prova final'
  return `Missão ${node.mission.slot} - ${node.mission.title}`
}

function TestCard({ world, node, state }: Omit<TrailCardProps, 'progress'>) {
  const form = node.kind === 'preTest' ? 'pre' : 'post'
  const title = nodeTitle(node)
  return (
    <motion.section className="mission-detail card" aria-label={title} variants={cardFlip} initial="hidden" animate="visible" exit="exit">
      <span className="mission-detail__role">{form === 'pre' ? 'Antes das missões' : 'Depois das missões'}</span>
      <h2 className="mission-detail__title">{title}</h2>
      <p>{`${ITEMS_PER_FORM} perguntas sobre ${world.conceptLabel.toLowerCase()}.`}</p>
      {state === 'done' && (
        <p className="mission-detail__status mission-detail__status--completed">
          <Icon name="check" size={16} /> Prova feita
        </p>
      )}
      {state === 'locked' && (
        <p className="mission-detail__lock">{form === 'pre' ? `Conclua o mundo anterior para abrir ${world.name}.` : `Conclua as ${MISSIONS_PER_WORLD} missões de ${world.name} primeiro.`}</p>
      )}
      {state === 'locked' ? (
        <GameButton tone="primary" size="lg" icon="flag" className="mission-detail__start" disabled>
          Fazer a prova
        </GameButton>
      ) : (
        state !== 'done' && (
          <GameLink to={assessmentPath(world.id, form)} tone="primary" size="lg" icon="flag" className="mission-detail__start">
            Fazer a prova
          </GameLink>
        )
      )}
    </motion.section>
  )
}

export function MissionDetailCard({ world, node, state, progress }: TrailCardProps) {
  const navigate = useNavigate()
  if (node.kind !== 'mission') return <TestCard world={world} node={node} state={state} />
  const { mission } = node
  const title = nodeTitle(node)
  const best = progress?.bestResult
  return (
    <motion.section className="mission-detail card" aria-label={title} variants={cardFlip} initial="hidden" animate="visible" exit="exit">
      <div className="mission-detail__preview" aria-hidden="true">
        <Grid2D state={createInitialState(mission)} highlightCells={objectiveCells(mission)} failed={false} />
      </div>
      <span className="mission-detail__role">{ROLE_LABELS[roleForSlot(mission.slot ?? 1)]}</span>
      <h2 className="mission-detail__title">{title}</h2>
      <p>{mission.briefing.goalText}</p>
      <div className="mission-detail__meta">
        <span>Dificuldade</span>
        <StarRow value={mission.difficulty} label={`Dificuldade ${mission.difficulty} de 3`} size={18} delay={0.1} />
      </div>
      <p className={`mission-detail__status mission-detail__status--${state === 'done' ? 'completed' : state === 'locked' ? 'locked' : 'available'}`}>
        <Icon name={state === 'done' ? 'check' : state === 'locked' ? 'lock' : 'play'} size={16} /> {STATE_TEXT[state]}
        {progress && progress.attempts > 0 && ` · ${progress.attempts} tentativa(s)`}
      </p>
      {best && (
        <p className="mission-detail__best">
          Melhor resultado: <StarRow value={best.efficiencyStars} label={`Eficiência ${best.efficiencyStars} de 3`} size={16} delay={0.2} /> · {best.actions} comandos · {best.blocks}{' '}
          blocos
        </p>
      )}
      {state === 'locked' && <p className="mission-detail__lock">Conclua a missão anterior da trilha para liberar esta.</p>}
      <GameButton tone="primary" size="lg" icon="play" className="mission-detail__start" disabled={state === 'locked'} onClick={() => navigate(`/jogar/${mission.id}`)}>
        {state === 'done' ? 'Jogar de novo' : 'Jogar'}
      </GameButton>
    </motion.section>
  )
}
