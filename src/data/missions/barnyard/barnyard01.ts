import { act, program, repeat, setVar, variable } from '@/blocks/interpreter/programBuilder'
import { BARNYARD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const barnyard01: MissionDefinition = {
  id: 'barnyard-01',
  order: 41,
  world: 'barnyard',
  slot: 1,
  title: 'Guardar um número',
  concept: 'variables',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Variável: uma caixinha com nome que guarda um número. Você pode usar esse número em outros blocos.',
    goalText: 'O programa já guarda 4 na variável "canteiros". Use essa variável no repita para plantar os 4 canteiros.',
  },
  map: { cells: ['. . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: BARNYARD_BLOCKS,
  initialProgram: program([setVar('canteiros', 4)]),
  objectives: [{ kind: 'cellsInState', cells: rowCells(0, 1, 4), state: 'seeded' }],
  efficiency: { referenceActions: 12, referenceBlocks: 6 },
  hints: [
    'A variável "canteiros" já vale 4.',
    'O repita pode usar uma variável no lugar do número.',
    'Encaixe o bloco da variável "canteiros" no repita.',
    'definir canteiros = 4; repita canteiros vezes: mover, preparar, plantar.',
  ],
  solutionExplanation: 'O repita leu o número guardado na variável. Se a horta mudar de tamanho, basta trocar o valor da variável.',
  referenceSolution: program([setVar('canteiros', 4), repeat(variable('canteiros'), [act('moveForward'), act('prepareSoil'), act('plant')])]),
}
