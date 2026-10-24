import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { ORCHARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const orchard03: MissionDefinition = {
  id: 'orchard-03',
  order: 13,
  world: 'orchard',
  slot: 3,
  title: 'Água contada',
  concept: 'conditionals',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Com pouca água, cada decisão conta: colha as maduras e regue só as mudas.',
    goalText: 'Colha as 2 frutas maduras e regue as 3 mudas usando no máximo 3 de água.',
  },
  map: { cells: ['. s m s m s'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: ORCHARD_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 2 }, { kind: 'cellsWet', cells: [[1, 0], [3, 0], [5, 0]] }],
  constraints: [{ kind: 'maxWaterUsed', value: 3 }],
  efficiency: { referenceActions: 10, referenceBlocks: 6 },
  hints: [
    'As árvores maduras também têm solo seco.',
    'Se regar as maduras, a água não chega.',
    'Se estiver madura, colha; senão, regue.',
    'repita 5: mover, se madura?: colher, senão: regar.',
  ],
  solutionExplanation: 'O "se/senão" separa as maduras das mudas e a água vai só para quem precisa.',
  referenceSolution: program([repeat(5, [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')], [act('water')])])]),
}
