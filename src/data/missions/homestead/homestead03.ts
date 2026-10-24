import { act, call, program, repeat } from '@/blocks/interpreter/programBuilder'
import { HOMESTEAD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const homestead03: MissionDefinition = {
  id: 'homestead-03',
  order: 28,
  world: 'homestead',
  slot: 3,
  title: 'Poucos blocos na fazenda',
  concept: 'efficiency',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Procedimentos encurtam programas grandes: o mesmo trabalho é escrito uma vez só.',
    goalText: 'Plante as três fileiras em zigue-zague usando no máximo 14 blocos.',
  },
  map: { cells: ['. . . .', '. . . .', '. . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: { maxBlocks: 14 },
  allowedBlocks: HOMESTEAD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [...rowCells(0, 1, 3), ...rowCells(1, 0, 2), ...rowCells(2, 1, 3)], state: 'seeded' }],
  efficiency: { referenceActions: 33, referenceBlocks: 14 },
  hints: [
    'As três fileiras pedem o mesmo trabalho.',
    'Coloque o trabalho de uma fileira num procedimento.',
    'Entre as fileiras, desça e vire.',
    'fileira: repita 3: mover, preparar, plantar; chame fileira três vezes com as curvas entre elas.',
  ],
  solutionExplanation: 'O procedimento "fileira" é escrito uma vez e chamado três vezes, e o programa cabe em 14 blocos.',
  referenceSolution: program([call('fileira'), act('turnRight'), act('moveForward'), act('turnRight'), call('fileira'), act('turnLeft'), act('moveForward'), act('turnLeft'), call('fileira')], { fileira: [repeat(3, [act('moveForward'), act('prepareSoil'), act('plant')])] }),
}
