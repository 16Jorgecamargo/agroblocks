import { act, changeVar, compare, program, setVar, variable, whileDo } from '@/blocks/interpreter/programBuilder'
import { BARNYARD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const barnyard09: MissionDefinition = {
  id: 'barnyard-09',
  order: 49,
  world: 'barnyard',
  slot: 9,
  title: 'Consertar o contador',
  concept: 'variables',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Se a variável nunca muda, o laço "enquanto" nunca termina.',
    goalText: 'Este programa tem um erro. Execute, descubra por que o robô não para e conserte para regar só os 3 canteiros.',
  },
  map: { cells: ['. s s s . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: BARNYARD_BLOCKS,
  initialProgram: program([setVar('agua', 3), whileDo(compare('GT', variable('agua'), 0), [act('moveForward'), act('water')])]),
  objectives: [{ kind: 'cellsWet', cells: rowCells(0, 1, 3) }, { kind: 'robotAt', x: 3, y: 0 }],
  efficiency: { referenceActions: 6, referenceBlocks: 7 },
  hints: [
    'Execute e veja até onde o robô vai.',
    'O laço depende de "agua" chegar a 0.',
    'Nada no laço muda o valor de "agua".',
    'Coloque "mudar agua por -1" dentro do laço.',
  ],
  solutionExplanation: 'Sem diminuir "agua", a condição continuava verdadeira e o robô andava até sair do celeiro.',
  referenceSolution: program([setVar('agua', 3), whileDo(compare('GT', variable('agua'), 0), [act('moveForward'), act('water'), changeVar('agua', -1)])]),
  commonMistakes: {
    OUT_OF_BOUNDS: 'O robô não parou. O valor de "agua" está diminuindo dentro do laço?',
  },
}
