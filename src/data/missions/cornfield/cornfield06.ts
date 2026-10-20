import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { CORNFIELD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const cornfield06: MissionDefinition = {
  id: 'cornfield-06',
  order: 16,
  world: 'cornfield',
  slot: 6,
  title: 'Cuidado completo',
  concept: 'repetition',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Quanto mais blocos dentro do repita, mais trabalho cada volta faz.',
    goalText: 'Prepare, plante e regue os 4 canteiros da fileira.',
  },
  map: { cells: ['. . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: CORNFIELD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: rowCells(0, 1, 4), state: 'seeded' }, { kind: 'cellsWet', cells: rowCells(0, 1, 4) }],
  efficiency: { referenceActions: 16, referenceBlocks: 5 },
  hints: [
    'Cada canteiro recebe os mesmos três cuidados.',
    'O robô precisa andar antes de cuidar de cada canteiro.',
    'Coloque 4 blocos dentro do repita.',
    'repita 4 vezes: mover, preparar, plantar, regar.',
  ],
  solutionExplanation: 'Quatro ações dentro de um repita de 4 voltas: 16 ações com 5 blocos.',
  referenceSolution: program([repeat(4, [act('moveForward'), act('prepareSoil'), act('plant'), act('water')])]),
}
