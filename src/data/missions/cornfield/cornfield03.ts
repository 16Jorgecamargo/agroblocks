import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { CORNFIELD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const cornfield03: MissionDefinition = {
  id: 'cornfield-03',
  order: 13,
  world: 'cornfield',
  slot: 3,
  title: 'Regar a fileira',
  concept: 'repetition',
  difficulty: 1,
  briefing: {
    conceptIntro: 'Dentro do repita pode ir mais de um bloco: tudo o que estiver dentro se repete junto.',
    goalText: 'As sementes já estão plantadas. Regue os 4 canteiros da fileira usando um repita.',
  },
  map: { cells: ['. s s s s'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: CORNFIELD_BLOCKS,
  objectives: [{ kind: 'cellsWet', cells: rowCells(0, 1, 4) }],
  efficiency: { referenceActions: 8, referenceBlocks: 3 },
  hints: [
    'São 4 canteiros, um depois do outro.',
    'Em cada canteiro o robô faz duas coisas.',
    'Andar e regar vão juntos dentro do repita.',
    'repita 4 vezes: mover para frente, regar canteiro.',
  ],
  solutionExplanation: 'Mover e regar formam um par que se repete 4 vezes. Com 3 blocos o robô faz 8 ações.',
  referenceSolution: program([repeat(4, [act('moveForward'), act('water')])]),
}
