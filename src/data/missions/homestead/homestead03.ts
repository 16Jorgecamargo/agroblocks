import { act, call, program, repeat } from '@/blocks/interpreter/programBuilder'
import { HOMESTEAD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const homestead03: MissionDefinition = {
  id: 'homestead-03',
  order: 53,
  world: 'homestead',
  slot: 3,
  title: 'Descer de fileira',
  concept: 'efficiency',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Procedimentos também servem para movimentos que se repetem, como trocar de fileira.',
    goalText: 'Cuide dos 3 canteiros de cima e dos 2 de baixo. Crie um procedimento para descer de fileira.',
  },
  map: { cells: ['. . . .', 'X . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: HOMESTEAD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [...rowCells(0, 1, 3), ...rowCells(1, 1, 2)], state: 'seeded' }, { kind: 'cellsWet', cells: [...rowCells(0, 1, 3), ...rowCells(1, 1, 2)] }],
  efficiency: { referenceActions: 23, referenceBlocks: 15 },
  hints: [
    'Use "cuidar" em cada canteiro.',
    'Descer de fileira é: virar à direita, mover, virar à direita.',
    'Crie o procedimento "descer" com esses três blocos.',
    'repita 3: mover, cuidar; descer; repita 2: mover, cuidar.',
  ],
  solutionExplanation: 'Dois procedimentos com nomes claros deixam o programa principal parecido com uma receita.',
  referenceSolution: program([repeat(3, [act('moveForward'), call('cuidar')]), call('descer'), repeat(2, [act('moveForward'), call('cuidar')])], { cuidar: [act('prepareSoil'), act('plant'), act('water')], descer: [act('turnRight'), act('moveForward'), act('turnRight')] }),
}
