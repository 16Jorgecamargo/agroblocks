import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { CORNFIELD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const cornfield04: MissionDefinition = {
  id: 'cornfield-04',
  order: 9,
  world: 'cornfield',
  slot: 4,
  title: 'Consertar a contagem',
  concept: 'repetition',
  difficulty: 2,
  briefing: {
    conceptIntro: 'O número do repita importa: uma volta a mais ou a menos muda tudo.',
    goalText: 'Este programa tem um erro. Execute, veja o que acontece e conserte para regar os 4 canteiros.',
  },
  map: { cells: ['. s s s s'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: CORNFIELD_BLOCKS,
  initialProgram: program([repeat(5, [act('moveForward'), act('water')])]),
  objectives: [{ kind: 'cellsWet', cells: rowCells(0, 1, 4) }],
  efficiency: { referenceActions: 8, referenceBlocks: 3 },
  hints: [
    'Execute e veja onde o robô para.',
    'Conte os canteiros da fileira.',
    'Só o número do repita está errado.',
    'Troque o 5 por 4.',
  ],
  solutionExplanation: 'Com 5 voltas o robô tenta andar além da fileira. O número certo é o de canteiros: 4.',
  referenceSolution: program([repeat(4, [act('moveForward'), act('water')])]),
  commonMistakes: {
    OUT_OF_BOUNDS: 'O robô passou do fim da fileira. O repita está dando voltas demais.',
  },
}
