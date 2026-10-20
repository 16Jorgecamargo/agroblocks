import { act, ifThen, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { GREENHOUSE_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const greenhouse10: MissionDefinition = {
  id: 'greenhouse-10',
  order: 40,
  world: 'greenhouse',
  slot: 10,
  title: 'Estufa completa',
  concept: 'sensors',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Desafio final da Estufa: laços enquanto e decisões para cuidar de três fileiras.',
    goalText: 'Percorra as três fileiras em zigue-zague: colha as maduras e regue as que estiverem secas.',
  },
  map: { cells: ['. m s m #', '# m s . X', 'X . m s m'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GREENHOUSE_BLOCKS,
  objectives: [{ kind: 'harvestAtLeast', count: 5 }, { kind: 'cellsWet', cells: [[2, 0], [2, 1], [3, 2]] }],
  efficiency: { referenceActions: 22, referenceBlocks: 36 },
  hints: [
    'Cada fileira termina num obstáculo ou na borda.',
    'Entre as fileiras, o robô desce uma casa e vira.',
    'O mesmo laço serve para as três fileiras.',
    'laço; virar à direita, mover, virar à direita; laço; virar à esquerda, mover, virar à esquerda; laço.',
  ],
  solutionExplanation: 'Três laços iguais cuidam das fileiras, e as curvas entre eles fazem o zigue-zague.',
  referenceSolution: program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')], [ifThen(sensor('isSoilDry'), [act('water')])])]), act('turnRight'), act('moveForward'), act('turnRight'), whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')], [ifThen(sensor('isSoilDry'), [act('water')])])]), act('turnLeft'), act('moveForward'), act('turnLeft'), whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')], [ifThen(sensor('isSoilDry'), [act('water')])])])]),
}
