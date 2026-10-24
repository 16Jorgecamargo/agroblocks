import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { CORNFIELD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const cornfield03: MissionDefinition = {
  id: 'cornfield-03',
  order: 8,
  world: 'cornfield',
  slot: 3,
  title: 'Poucos blocos',
  concept: 'repetition',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Um bom programa é curto: use o repita para caber no limite de blocos.',
    goalText: 'Plante nos 8 canteiros da fileira usando no máximo 5 blocos.',
  },
  map: { cells: ['. . . . . . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: { maxBlocks: 5 },
  allowedBlocks: CORNFIELD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: rowCells(0, 1, 8), state: 'seeded' }],
  efficiency: { referenceActions: 24, referenceBlocks: 4 },
  hints: [
    'Sem repita você precisaria de 24 blocos.',
    'O trabalho em cada canteiro é sempre igual.',
    'Quantas vezes o repita precisa rodar?',
    'repita 8 vezes: mover, preparar, plantar.',
  ],
  solutionExplanation: 'O limite de 5 blocos obriga a usar o repita: 4 blocos fazem 24 ações.',
  referenceSolution: program([repeat(8, [act('moveForward'), act('prepareSoil'), act('plant')])]),
}
