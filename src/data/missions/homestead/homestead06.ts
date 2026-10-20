import { act, call, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { HOMESTEAD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const homestead06: MissionDefinition = {
  id: 'homestead-06',
  order: 56,
  world: 'homestead',
  slot: 6,
  title: 'Procedimento no laço',
  concept: 'efficiency',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Procedimentos e laços enquanto trabalham juntos: o laço percorre e o procedimento cuida.',
    goalText: 'Ande até a parede chamando "cuidar" em cada canteiro.',
  },
  map: { cells: ['. . . . #'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: HOMESTEAD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: rowCells(0, 1, 3), state: 'seeded' }, { kind: 'cellsWet', cells: rowCells(0, 1, 3) }],
  efficiency: { referenceActions: 12, referenceBlocks: 9 },
  hints: [
    'Você não precisa contar os canteiros.',
    'Use "enquanto não há obstáculo à frente".',
    'Dentro do laço: andar e chamar "cuidar".',
    'enquanto não há obstáculo: mover, cuidar.',
  ],
  solutionExplanation: 'O laço enquanto e o procedimento juntos cuidam de uma fileira de qualquer tamanho.',
  referenceSolution: program([whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), call('cuidar')])], { cuidar: [act('prepareSoil'), act('plant'), act('water')] }),
}
