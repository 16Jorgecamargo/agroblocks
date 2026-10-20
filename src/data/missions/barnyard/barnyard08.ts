import { act, program, repeat, setVar, variable } from '@/blocks/interpreter/programBuilder'
import { BARNYARD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const barnyard08: MissionDefinition = {
  id: 'barnyard-08',
  order: 48,
  world: 'barnyard',
  slot: 8,
  title: 'Reaproveitar o número',
  concept: 'variables',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Quando o mesmo número aparece duas vezes, uma variável evita repetir e ajuda a caber no limite.',
    goalText: 'Plante os 5 canteiros e regue todos na volta, usando no máximo 13 blocos.',
  },
  map: { cells: ['. . . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: { maxBlocks: 13 },
  allowedBlocks: BARNYARD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: rowCells(0, 1, 5), state: 'seeded' }, { kind: 'cellsWet', cells: rowCells(0, 1, 5) }],
  efficiency: { referenceActions: 27, referenceBlocks: 12 },
  hints: [
    'Ida e volta passam pelos mesmos 5 canteiros.',
    'Guarde o 5 numa variável e use nos dois repita.',
    'Na volta: regar e depois andar.',
    'definir n = 5; repita n: mover, preparar, plantar; meia-volta; repita n: regar, mover.',
  ],
  solutionExplanation: 'A variável "n" é usada duas vezes; o programa fica curto e fácil de mudar.',
  referenceSolution: program([setVar('n', 5), repeat(variable('n'), [act('moveForward'), act('prepareSoil'), act('plant')]), act('turnRight'), act('turnRight'), repeat(variable('n'), [act('water'), act('moveForward')])]),
}
