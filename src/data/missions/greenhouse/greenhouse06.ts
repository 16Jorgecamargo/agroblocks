import { act, ifThen, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { GREENHOUSE_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const greenhouse06: MissionDefinition = {
  id: 'greenhouse-06',
  order: 36,
  world: 'greenhouse',
  slot: 6,
  title: 'Cuidar no caminho',
  concept: 'sensors',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Dentro do enquanto pode ter um "se/senão" para decidir o trabalho de cada casa.',
    goalText: 'Até a parede: colha as mudas maduras e regue as outras.',
  },
  map: { cells: ['. m s m s m #'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GREENHOUSE_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 3 }, { kind: 'cellsWet', cells: [[2, 0], [4, 0]] }],
  efficiency: { referenceActions: 10, referenceBlocks: 8 },
  hints: [
    'Algumas mudas estão maduras, outras não.',
    'Use "se/senão" dentro do enquanto.',
    'Se madura: colher. Senão: regar.',
    'enquanto não há obstáculo: mover, se madura: colher, senão: regar.',
  ],
  solutionExplanation: 'O enquanto percorre a fileira e o "se/senão" decide em cada casa.',
  referenceSolution: program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')], [act('water')])])]),
}
