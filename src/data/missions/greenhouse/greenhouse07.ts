import { act, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { GREENHOUSE_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const greenhouse07: MissionDefinition = {
  id: 'greenhouse-07',
  order: 37,
  world: 'greenhouse',
  slot: 7,
  title: 'Energia na medida',
  concept: 'sensors',
  difficulty: 3,
  briefing: {
    conceptIntro: 'O enquanto para no lugar certo: nenhum passo a mais, nenhuma energia a mais.',
    goalText: 'Chegue até a parede e colha a muda gastando no máximo 7 de energia.',
  },
  map: { cells: ['. . . . . . m #'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GREENHOUSE_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  constraints: [{ kind: 'maxEnergyUsed', value: 7 }],
  efficiency: { referenceActions: 7, referenceBlocks: 5 },
  hints: [
    'São 6 passos e uma colheita.',
    'Andar até a parede com enquanto não gasta passos a mais.',
    'Colher só no fim.',
    'enquanto não há obstáculo: mover; colher.',
  ],
  solutionExplanation: 'O laço para exatamente na parede: 6 passos mais a colheita somam 7.',
  referenceSolution: program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward')]), act('harvest')]),
}
