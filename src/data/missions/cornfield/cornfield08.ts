import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { CORNFIELD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const cornfield08: MissionDefinition = {
  id: 'cornfield-08',
  order: 18,
  world: 'cornfield',
  slot: 8,
  title: 'Energia de sobra não',
  concept: 'repetition',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Laços que dão voltas a mais gastam energia à toa.',
    goalText: 'Colha os 5 pés de milho gastando no máximo 10 de energia.',
  },
  map: { cells: ['. m m m m m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: CORNFIELD_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 5 }],
  constraints: [{ kind: 'maxEnergyUsed', value: 10 }],
  efficiency: { referenceActions: 10, referenceBlocks: 3 },
  hints: [
    'Andar e colher gastam 1 de energia cada.',
    '5 pés de milho, 5 passos e 5 colheitas.',
    'Não dê nenhuma volta a mais no repita.',
    'repita 5 vezes: mover, colher.',
  ],
  solutionExplanation: 'Cada volta gasta 2 de energia; 5 voltas somam exatamente 10.',
  referenceSolution: program([repeat(5, [act('moveForward'), act('harvest')])]),
}
