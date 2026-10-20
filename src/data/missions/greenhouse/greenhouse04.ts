import { act, ifThen, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { GREENHOUSE_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const greenhouse04: MissionDefinition = {
  id: 'greenhouse-04',
  order: 34,
  world: 'greenhouse',
  slot: 4,
  title: 'Fileiras diferentes',
  concept: 'sensors',
  difficulty: 2,
  briefing: {
    conceptIntro: 'O mesmo enquanto serve para fileiras de qualquer tamanho.',
    goalText: 'Colha as mudas maduras da fileira de cima e da de baixo. As fileiras têm tamanhos diferentes.',
  },
  map: { cells: ['. m m m #', 'X m m . X'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GREENHOUSE_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 5 }],
  efficiency: { referenceActions: 13, referenceBlocks: 17 },
  hints: [
    'Cada fileira termina num obstáculo.',
    'No fim da fileira de cima, desça pela coluna livre.',
    'Use o mesmo laço nas duas fileiras.',
    'enquanto não há obstáculo: mover, se madura: colher; virar à direita, mover, virar à direita; repita o laço.',
  ],
  solutionExplanation: 'O enquanto não precisa saber o tamanho da fileira: para quando encontra o obstáculo.',
  referenceSolution: program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')])]), act('turnRight'), act('moveForward'), act('turnRight'), whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')])])]),
}
