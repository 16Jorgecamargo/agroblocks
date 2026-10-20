import { act, program, repeat } from '@/blocks/interpreter/programBuilder'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const cornfield02: MissionDefinition = {
  id: 'cornfield-02',
  order: 12,
  world: 'cornfield',
  slot: 2,
  title: 'Plantação em série',
  concept: 'repetition',
  difficulty: 1,
  briefing: {
    conceptIntro:
      'Repetição: quando o mesmo grupo de comandos aparece várias vezes, um laço "repita N vezes" faz o trabalho com menos blocos.',
    goalText: 'Prepare o solo e plante uma semente em cada um dos 6 canteiros da fileira.',
    demo: program([act('moveForward'), act('prepareSoil'), act('plant')]),
  },
  map: { cells: ['X X X X X X X X', '. . . . . . . #', 'X X X X X X X X'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: { seeds: 6, water: null, energy: null, seedCapacity: 6, waterCapacity: null },
  growTicks: 3,
  rules: {},
  allowedBlocks: [
    'robot_move_forward',
    'robot_turn_left',
    'robot_turn_right',
    'farm_prepare_soil',
    'farm_plant',
    'farm_harvest',
    'controls_repeat_ext',
  ],
  objectives: [{ kind: 'cellsInState', cells: rowCells(1, 1, 6), state: 'seeded' }],
  efficiency: { referenceActions: 18, referenceBlocks: 4 },
  hints: [
    'Observe: o trabalho em cada canteiro é sempre o mesmo.',
    'Para cada canteiro o robô precisa andar, preparar e plantar. Quantos canteiros existem?',
    'Procure o bloco "repita" na categoria Controle.',
    'Exemplo parcial: repita 6 vezes: mover para frente, preparar solo, ...',
  ],
  solutionExplanation:
    'O laço repetiu três ações (mover, preparar, plantar) seis vezes. Com 4 blocos você fez o trabalho de 18.',
  referenceSolution: program([repeat(6, [act('moveForward'), act('prepareSoil'), act('plant')])]),
  commonMistakes: {
    HIT_OBSTACLE: 'O laço repetiu vezes demais e o robô chegou na cerca. Conte os canteiros de novo.',
    NO_SEEDS: 'Você tem exatamente 6 sementes, uma por canteiro.',
    SOIL_NOT_READY: 'Prepare o solo antes de plantar.',
  },
}
