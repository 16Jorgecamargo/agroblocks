import { act, call, program, repeat } from '@/blocks/interpreter/programBuilder'
import { HOMESTEAD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const homestead08: MissionDefinition = {
  id: 'homestead-08',
  order: 58,
  world: 'homestead',
  slot: 8,
  title: 'Energia contada',
  concept: 'efficiency',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Um procedimento bem feito não tem passos sobrando.',
    goalText: 'Colha os 4 pés maduros gastando no máximo 8 de energia.',
  },
  map: { cells: ['. m m m m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: HOMESTEAD_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 4 }],
  constraints: [{ kind: 'maxEnergyUsed', value: 8 }],
  efficiency: { referenceActions: 8, referenceBlocks: 5 },
  hints: [
    'Cada pé custa um passo e uma colheita.',
    '4 pés: 8 de energia, sem sobras.',
    'Crie o procedimento "colher" com andar e colher.',
    'repita 4: colher.',
  ],
  solutionExplanation: 'Cada chamada do procedimento gasta exatamente 2 de energia.',
  referenceSolution: program([repeat(4, [call('colher')])], { colher: [act('moveForward'), act('harvest')] }),
}
