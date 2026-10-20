import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { ORCHARD_BLOCKS } from '@/data/missions/blockSets'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const orchard06: MissionDefinition = {
  id: 'orchard-06',
  order: 26,
  world: 'orchard',
  slot: 6,
  title: 'Se não, regue',
  concept: 'conditionals',
  difficulty: 2,
  briefing: {
    conceptIntro: 'O "se/senão" tem dois caminhos: um para quando a condição é verdadeira e outro para quando é falsa.',
    goalText: 'Plante nos canteiros vazios e regue os que já têm muda.',
  },
  map: { cells: ['. . s . s'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: ORCHARD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [[1, 0], [2, 0], [3, 0], [4, 0]], state: 'seeded' }, { kind: 'cellsWet', cells: [[2, 0], [4, 0]] }],
  efficiency: { referenceActions: 10, referenceBlocks: 7 },
  hints: [
    'Cada canteiro pede uma coisa diferente.',
    'Vazio: preparar e plantar. Com muda: regar.',
    'Use o "se" com a parte "senão" (clique na engrenagem do bloco).',
    'repita 4: mover, se vazio?: preparar, plantar, senão: regar.',
  ],
  solutionExplanation: 'Com "se/senão" o robô decide entre dois trabalhos em cada canteiro, sem precisar de dois "se".',
  referenceSolution: program([repeat(4, [act('moveForward'), ifThen(sensor('isPlotEmpty'), [act('prepareSoil'), act('plant')], [act('water')])])]),
}
