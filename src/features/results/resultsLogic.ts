import { runProgram } from '@/blocks/interpreter/runProgram'
import { programToPseudocode } from '@/blocks/pseudocode/pseudocode'
import { getNextMission } from '@/data/missions'
import type { MissionConcept, MissionDefinition } from '@/game/missions/missionTypes'
import { toControllerMission } from '@/game/missions/toControllerMission'
import type { AttemptRecord, SaveData } from '@/game/progress/types'

export function latestSuccess(save: SaveData, missionId: string): AttemptRecord | null {
  const successes = save.attempts.filter((attempt) => attempt.missionId === missionId && attempt.outcome === 'success')
  return successes.at(-1) ?? null
}

export function previousBestBefore(save: SaveData, attempt: AttemptRecord): AttemptRecord | null {
  const earlier = save.attempts.filter(
    (candidate) =>
      candidate.missionId === attempt.missionId && candidate.outcome === 'success' && candidate.attemptNumber < attempt.attemptNumber,
  )
  return earlier.reduce<AttemptRecord | null>((best, candidate) => {
    if (!best) return candidate
    const candidateStars = candidate.efficiencyStars ?? 0
    const bestStars = best.efficiencyStars ?? 0
    if (candidateStars !== bestStars) return candidateStars > bestStars ? candidate : best
    return candidate.actions < best.actions ? candidate : best
  }, null)
}

export function referenceStats(mission: MissionDefinition): { actions: number; blocks: number; pseudocode: string } {
  const controllerMission = toControllerMission(mission)
  const result = runProgram(mission.referenceSolution, controllerMission.initialState, controllerMission.rules, controllerMission.stepLimit)
  return {
    actions: result.state.actionCount,
    blocks: mission.efficiency.referenceBlocks,
    pseudocode: programToPseudocode(mission.referenceSolution),
  }
}

export const CONCEPT_TIPS: Record<MissionConcept, string> = {
  interface: 'Leia o console depois de cada execução: ele conta exatamente o que o robô fez.',
  sequencing: 'Antes de montar, descreva o caminho em voz alta. A ordem dos blocos é a ordem das ações.',
  repetition: 'Use laços sempre que perceber um padrão de ações repetidas. Isso deixa o programa mais curto e fácil de entender.',
  conditionals: 'Condições deixam o robô reagir ao mundo. Pergunte antes de agir quando o estado do canteiro pode variar.',
  sensors: 'O laço "enquanto" funciona para qualquer tamanho de fileira, porque depende do que o sensor percebe.',
  variables: 'Variáveis são a memória do programa. Dê nomes que expliquem o que elas contam.',
  efficiency: 'Execute passo a passo para encontrar bugs. Procedimentos dão nome a um grupo de ações e evitam repetição.',
}

export function nextStep(mission: MissionDefinition, save: SaveData): { label: string; to: string } {
  const next = getNextMission(mission.id)
  if (next) return { label: 'Próxima fase', to: `/jogar/${next.id}` }
  if (!save.assessments.homestead.post) return { label: 'Fazer avaliação final', to: '/avaliacao/pos' }
  return { label: 'Voltar às missões', to: '/missoes' }
}
