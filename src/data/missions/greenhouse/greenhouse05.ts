import { act, ifThen, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { GREENHOUSE_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const greenhouse05: MissionDefinition = {
  id: 'greenhouse-05',
  order: 35,
  world: 'greenhouse',
  slot: 5,
  title: 'Ir e voltar',
  concept: 'sensors',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Um laço leva o robô até a parede; outro o traz de volta.',
    goalText: 'Regue os canteiros até a parede e volte para o começo.',
  },
  map: { cells: ['. s s s s #'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: GREENHOUSE_BLOCKS,
  objectives: [{ kind: 'cellsWet', cells: rowCells(0, 1, 4) }, { kind: 'robotAt', x: 0, y: 0 }],
  efficiency: { referenceActions: 14, referenceBlocks: 13 },
  hints: [
    'Na ida, regue cada canteiro.',
    'Para voltar, o robô dá meia-volta.',
    'A borda da estufa também conta como obstáculo.',
    'enquanto não há obstáculo: mover, se seco: regar; meia-volta; enquanto não há obstáculo: mover.',
  ],
  solutionExplanation: 'Dois laços enquanto: um para ir regando e outro para voltar, sem contar casas.',
  referenceSolution: program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])]), act('turnRight'), act('turnRight'), whileDo(not(sensor('isObstacleAhead')), [act('moveForward')])]),
}
