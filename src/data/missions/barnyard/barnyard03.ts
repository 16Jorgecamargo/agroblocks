import { act, changeVar, compare, program, setVar, variable, whileDo } from '@/blocks/interpreter/programBuilder'
import { BARNYARD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const barnyard03: MissionDefinition = {
  id: 'barnyard-03',
  order: 43,
  world: 'barnyard',
  slot: 3,
  title: 'Água no tanque',
  concept: 'variables',
  difficulty: 2,
  briefing: {
    conceptIntro: 'A variável pode descer também: tire 1 a cada rega e pare quando chegar a zero.',
    goalText: 'A variável "agua" começa em 3. Regue um canteiro por vez enquanto ela for maior que 0 e pare no último.',
  },
  map: { cells: ['. s s s . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: BARNYARD_BLOCKS,
  objectives: [{ kind: 'cellsWet', cells: rowCells(0, 1, 3) }, { kind: 'robotAt', x: 3, y: 0 }],
  efficiency: { referenceActions: 6, referenceBlocks: 7 },
  hints: [
    'Comece com "agua" valendo 3.',
    'Depois de cada rega, tire 1 de "agua".',
    'O laço roda enquanto "agua" for maior que 0.',
    'definir agua = 3; enquanto agua > 0: mover, regar, mudar agua por -1.',
  ],
  solutionExplanation: 'A variável desce 3, 2, 1, 0 e o laço para no terceiro canteiro.',
  referenceSolution: program([setVar('agua', 3), whileDo(compare('GT', variable('agua'), 0), [act('moveForward'), act('water'), changeVar('agua', -1)])]),
}
