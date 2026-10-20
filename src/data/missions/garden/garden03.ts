import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const garden03: MissionDefinition = {
  id: 'garden-03',
  order: 3,
  world: 'garden',
  slot: 3,
  title: 'Cuidar do canteiro',
  concept: 'sequencing',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Uma boa sequência para cultivar é sempre a mesma: preparar o solo, plantar e regar.',
    goalText: 'Prepare, plante e regue o canteiro no fim da fileira.',
  },
  map: { cells: ['. . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GARDEN_BLOCKS,
  objectives: [
    { kind: 'cellsInState', cells: [[2, 0]], state: 'seeded' },
    { kind: 'cellsWet', cells: [[2, 0]] },
  ],
  efficiency: { referenceActions: 5, referenceBlocks: 5 },
  hints: [
    'O canteiro é o último da fileira.',
    'São três cuidados, sempre na mesma ordem.',
    'Regar vem por último: a semente precisa estar na terra.',
    'mover, mover, preparar solo, plantar semente, regar canteiro.',
  ],
  solutionExplanation: 'Preparar, plantar e regar formam uma sequência fixa. Regar antes de plantar molha a terra, mas a semente ainda não está lá.',
  referenceSolution: program([act('moveForward'), act('moveForward'), act('prepareSoil'), act('plant'), act('water')]),
  commonMistakes: {
    SOIL_NOT_READY: 'Prepare o solo antes de plantar.',
  },
}
