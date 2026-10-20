import { act, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import { GREENHOUSE_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const greenhouse02: MissionDefinition = {
  id: 'greenhouse-02',
  order: 32,
  world: 'greenhouse',
  slot: 2,
  title: 'Enquanto houver sementes',
  concept: 'sensors',
  difficulty: 1,
  briefing: {
    conceptIntro: 'O sensor "há sementes?" fica falso quando o saco esvazia. Use-o no enquanto.',
    goalText: 'Prepare e plante canteiros seguidos enquanto houver sementes no saco.',
  },
  map: { cells: ['. . . . . . .'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: { seeds: 4, water: null, energy: null, seedCapacity: 4, waterCapacity: null },
  growTicks: 99,
  rules: {},
  allowedBlocks: GREENHOUSE_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: rowCells(0, 1, 4), state: 'seeded' }],
  efficiency: { referenceActions: 12, referenceBlocks: 5 },
  hints: [
    'Há 4 sementes no saco.',
    'O laço deve parar quando as sementes acabarem.',
    'Use "enquanto há sementes?".',
    'enquanto há sementes?: mover, preparar, plantar.',
  ],
  solutionExplanation: 'O laço planta até o saco esvaziar: com 4 sementes, 4 canteiros.',
  referenceSolution: program([whileDo(sensor('hasSeeds'), [act('moveForward'), act('prepareSoil'), act('plant')])]),
}
