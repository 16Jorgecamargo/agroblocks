import { act, program, repeat, setVar, variable } from '@/blocks/interpreter/programBuilder'
import { BARNYARD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const barnyard07: MissionDefinition = {
  id: 'barnyard-07',
  order: 47,
  world: 'barnyard',
  slot: 7,
  title: 'Recursos contados',
  concept: 'variables',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Com recursos limitados, a variável garante que o robô não gaste demais.',
    goalText: 'Plante e regue 4 canteiros usando no máximo 4 sementes e 4 de água.',
  },
  map: { cells: ['. . . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: BARNYARD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: rowCells(0, 1, 4), state: 'seeded' }, { kind: 'cellsWet', cells: rowCells(0, 1, 4) }],
  constraints: [{ kind: 'maxSeedsUsed', value: 4 }, { kind: 'maxWaterUsed', value: 4 }],
  efficiency: { referenceActions: 16, referenceBlocks: 7 },
  hints: [
    'São exatamente 4 canteiros.',
    'Guarde o 4 numa variável.',
    'Cada canteiro gasta 1 semente e 1 de água.',
    'definir canteiros = 4; repita canteiros: mover, preparar, plantar, regar.',
  ],
  solutionExplanation: 'A variável fixa quantos canteiros recebem semente e água; nada passa do limite.',
  referenceSolution: program([setVar('canteiros', 4), repeat(variable('canteiros'), [act('moveForward'), act('prepareSoil'), act('plant'), act('water')])]),
}
