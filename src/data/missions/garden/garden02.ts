import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const garden02: MissionDefinition = {
  id: 'garden-02',
  order: 2,
  world: 'garden',
  slot: 2,
  title: 'Hora de plantar',
  concept: 'sequencing',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Algumas ações dependem de outras: para plantar, o solo precisa estar preparado antes.',
    goalText: 'Ande até o canteiro marcado, prepare o solo e plante uma semente.',
  },
  map: { cells: ['X X X X', '. . . .', 'X X X X'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GARDEN_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [[2, 1]], state: 'seeded' }],
  efficiency: { referenceActions: 4, referenceBlocks: 4 },
  hints: [
    'Primeiro o robô precisa estar em cima do canteiro.',
    'O canteiro fica duas casas à frente.',
    'Plantar sem preparar o solo dá erro.',
    'mover, mover, preparar solo, plantar semente.',
  ],
  solutionExplanation: 'Andar, preparar e plantar: se "plantar" vier antes de "preparar solo", o robô encontra terra dura e para com erro.',
  referenceSolution: program([act('moveForward'), act('moveForward'), act('prepareSoil'), act('plant')]),
  commonMistakes: {
    SOIL_NOT_READY: 'O solo ainda está duro. Coloque "preparar solo" antes de "plantar semente".',
  },
}
