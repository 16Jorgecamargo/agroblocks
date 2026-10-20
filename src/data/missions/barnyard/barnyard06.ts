import { act, changeVar, program, repeat, setVar, variable } from '@/blocks/interpreter/programBuilder'
import { BARNYARD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const barnyard06: MissionDefinition = {
  id: 'barnyard-06',
  order: 46,
  world: 'barnyard',
  slot: 6,
  title: 'Fileira que encolhe',
  concept: 'variables',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Mudar uma variável dentro do laço faz cada volta ser um pouco diferente.',
    goalText: 'Plante a fileira de cima (4 canteiros) e a de baixo (3 canteiros). Diminua a variável "tamanho" de uma fileira para a outra.',
  },
  map: { cells: ['. . . . .', 'X . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: BARNYARD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [...rowCells(0, 1, 4), ...rowCells(1, 1, 3)], state: 'seeded' }],
  efficiency: { referenceActions: 27, referenceBlocks: 11 },
  hints: [
    'A fileira de baixo tem um canteiro a menos.',
    'Use a variável no repita de dentro.',
    'Depois de cada fileira, desça e tire 1 de "tamanho".',
    'definir tamanho = 4; repita 2: (repita tamanho: mover, preparar, plantar), virar à direita, mover, virar à direita, mudar tamanho por -1.',
  ],
  solutionExplanation: 'A mesma sequência serve para as duas fileiras porque a variável muda de 4 para 3.',
  referenceSolution: program([setVar('tamanho', 4), repeat(2, [repeat(variable('tamanho'), [act('moveForward'), act('prepareSoil'), act('plant')]), act('turnRight'), act('moveForward'), act('turnRight'), changeVar('tamanho', -1)])]),
}
