import { act, program } from '@/blocks/interpreter/programBuilder'
import { GARDEN_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const garden08: MissionDefinition = {
  id: 'garden-08',
  order: 8,
  world: 'garden',
  slot: 8,
  title: 'Sementes contadas',
  concept: 'sequencing',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Recursos acabam. Planeje a sequência para não gastar semente onde não precisa.',
    goalText: 'Plante nos três canteiros marcados usando só as 3 sementes que você tem.',
  },
  map: { cells: ['. . . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: { seeds: 3, water: null, energy: null, seedCapacity: 3, waterCapacity: null },
  growTicks: 99,
  rules: {},
  allowedBlocks: GARDEN_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [[1, 0], [3, 0], [5, 0]], state: 'seeded' }],
  constraints: [{ kind: 'maxSeedsUsed', value: 3 }],
  efficiency: { referenceActions: 11, referenceBlocks: 11 },
  hints: [
    'Os canteiros são a 2ª, a 4ª e a 6ª casa.',
    'Plante só nos canteiros marcados.',
    'Antes de cada plantio, prepare o solo daquela casa.',
    'mover, preparar, plantar, mover, mover, preparar, plantar, mover, mover, preparar, plantar.',
  ],
  solutionExplanation: 'Três sementes para três canteiros: a sequência pula as casas do meio e não desperdiça nada.',
  referenceSolution: program([
    act('moveForward'),
    act('prepareSoil'),
    act('plant'),
    act('moveForward'),
    act('moveForward'),
    act('prepareSoil'),
    act('plant'),
    act('moveForward'),
    act('moveForward'),
    act('prepareSoil'),
    act('plant'),
  ]),
  commonMistakes: {
    NO_SEEDS: 'As sementes acabaram. Plante só nos canteiros marcados.',
  },
}
