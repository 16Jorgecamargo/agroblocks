import { act, program, repeat, setVar, variable } from '@/blocks/interpreter/programBuilder'
import { BARNYARD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const barnyard04: MissionDefinition = {
  id: 'barnyard-04',
  order: 44,
  world: 'barnyard',
  slot: 4,
  title: 'Duas variáveis',
  concept: 'variables',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Cada variável guarda um número diferente. Dê nomes que expliquem o que elas contam.',
    goalText: 'Plante 3 canteiros e, na volta, regue os 2 últimos. Guarde as duas quantidades em variáveis.',
  },
  map: { cells: ['. . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: BARNYARD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: rowCells(0, 1, 3), state: 'seeded' }, { kind: 'cellsWet', cells: [[2, 0], [3, 0]] }],
  efficiency: { referenceActions: 15, referenceBlocks: 13 },
  hints: [
    'Uma variável para quantos plantar, outra para quantos regar.',
    'Depois de plantar, o robô dá meia-volta.',
    'Na volta, regue e ande, nessa ordem.',
    'definir plantar = 3, regar = 2; repita plantar: mover, preparar, plantar; meia-volta; repita regar: regar, mover.',
  ],
  solutionExplanation: 'Duas variáveis deixam claro o que cada número significa no programa.',
  referenceSolution: program([setVar('plantar', 3), setVar('regar', 2), repeat(variable('plantar'), [act('moveForward'), act('prepareSoil'), act('plant')]), act('turnRight'), act('turnRight'), repeat(variable('regar'), [act('water'), act('moveForward')])]),
}
