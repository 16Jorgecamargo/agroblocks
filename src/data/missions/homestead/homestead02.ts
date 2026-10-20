import { act, call, program, repeat } from '@/blocks/interpreter/programBuilder'
import { HOMESTEAD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const homestead02: MissionDefinition = {
  id: 'homestead-02',
  order: 52,
  world: 'homestead',
  slot: 2,
  title: 'Cuidar da fileira',
  concept: 'efficiency',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Um procedimento pode ser chamado várias vezes, inclusive dentro de um repita.',
    goalText: 'Use o procedimento "cuidar" num repita para cuidar dos 4 canteiros.',
  },
  map: { cells: ['. . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: HOMESTEAD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: rowCells(0, 1, 4), state: 'seeded' }, { kind: 'cellsWet', cells: rowCells(0, 1, 4) }],
  efficiency: { referenceActions: 16, referenceBlocks: 7 },
  hints: [
    'Crie o procedimento "cuidar" com os três cuidados.',
    'No programa principal, ande e chame "cuidar".',
    'Coloque isso dentro de um repita.',
    'repita 4: mover, cuidar.',
  ],
  solutionExplanation: 'O repita chama "cuidar" quatro vezes: 16 ações com poucos blocos.',
  referenceSolution: program([repeat(4, [act('moveForward'), call('cuidar')])], { cuidar: [act('prepareSoil'), act('plant'), act('water')] }),
}
