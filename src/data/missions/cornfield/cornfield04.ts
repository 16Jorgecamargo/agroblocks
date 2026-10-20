import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { CORNFIELD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

export const cornfield04: MissionDefinition = {
  id: 'cornfield-04',
  order: 14,
  world: 'cornfield',
  slot: 4,
  title: 'Duas fileiras',
  concept: 'repetition',
  difficulty: 2,
  briefing: {
    conceptIntro: 'Um programa pode ter mais de um repita, com outros blocos entre eles.',
    goalText: 'Prepare e plante as 3 casas da fileira de cima e as 3 da fileira de baixo.',
  },
  map: { cells: ['. . . .', 'X X X .', '. . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 99,
  rules: {},
  allowedBlocks: CORNFIELD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [...rowCells(0, 1, 3), ...rowCells(2, 0, 2)], state: 'seeded' }],
  efficiency: { referenceActions: 22, referenceBlocks: 12 },
  hints: [
    'As duas fileiras pedem o mesmo trabalho.',
    'No fim da fileira de cima, o robô desce pela coluna da direita.',
    'Use um repita para cada fileira e as curvas no meio.',
    'repita 3: mover, preparar, plantar; virar à direita; mover; mover; virar à direita; repita 3 de novo.',
  ],
  solutionExplanation: 'Dois repita iguais cuidam das fileiras; as curvas entre eles levam o robô de uma para a outra.',
  referenceSolution: program([repeat(3, [act('moveForward'), act('prepareSoil'), act('plant')]), act('turnRight'), act('moveForward'), act('moveForward'), act('turnRight'), repeat(3, [act('moveForward'), act('prepareSoil'), act('plant')])]),
}
