import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const garden07: MissionDefinition = {
  id: 'garden-07',
  order: 7,
  world: 'garden',
  slot: 7,
  title: 'Energia contada',
  concept: 'sequencing',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Um bom algoritmo não dá voltas à toa: cada passo a mais gasta energia.',
    goalText: 'Colha a planta do canto gastando no máximo 7 de energia.',
  },
  map: { cells: ['. . . . .', '. . . . .', '. # # # m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GARDEN_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 1 }],
  constraints: [{ kind: 'maxEnergyUsed', value: 7 }],
  efficiency: { referenceActions: 8, referenceBlocks: 8 },
  hints: [
    'Andar e colher gastam 1 de energia cada; virar não gasta nada.',
    'Qual é o caminho mais curto até a planta?',
    'A fileira de baixo tem pedras. Vá primeiro para a direita.',
    'quatro vezes mover, virar à direita, duas vezes mover, colher.',
  ],
  solutionExplanation: 'Seis passos e uma colheita somam 7 de energia. Qualquer volta a mais passa do limite.',
  referenceSolution: program([
    act('moveForward'),
    act('moveForward'),
    act('moveForward'),
    act('moveForward'),
    act('turnRight'),
    act('moveForward'),
    act('moveForward'),
    act('harvest'),
  ]),
}
