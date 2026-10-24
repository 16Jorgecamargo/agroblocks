import { act, ifThen, program, repeat, sensor } from '@/blocks/interpreter/programBuilder'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const orchard02: MissionDefinition = {
  id: 'orchard-02',
  order: 12,
  world: 'orchard',
  slot: 2,
  title: 'Irrigação inteligente',
  concept: 'conditionals',
  difficulty: 2,
  briefing: {
    conceptIntro:
      'Condicionais: o bloco "se" deixa o robô decidir. Ele só executa os comandos de dentro quando a condição é verdadeira. Com "senão" você diz o que fazer quando ela é falsa.',
    goalText: 'Deixe os 6 canteiros com solo molhado sem regar nenhum que já esteja molhado.',
    demo: program([act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])]),
  },
  map: { cells: ['X X X X X X X X', '. s sw s sw sw s #', 'X X X X X X X X'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: { seeds: null, water: 4, energy: null, seedCapacity: null, waterCapacity: 4 },
  growTicks: 20,
  rules: { forbidWaterWet: true },
  allowedBlocks: [
    'robot_move_forward',
    'robot_turn_left',
    'robot_turn_right',
    'farm_water',
    'farm_harvest',
    'sensor_soil_dry',
    'controls_repeat_ext',
    'controls_if',
  ],
  objectives: [{ kind: 'cellsWet', cells: rowCells(1, 1, 6) }],
  constraints: [{ kind: 'maxWaterUsed', value: 3 }],
  efficiency: { referenceActions: 9, referenceBlocks: 5 },
  hints: [
    'Nem todo canteiro precisa de água. O robô precisa olhar antes de agir.',
    'A condição que importa é: o solo está seco?',
    'Use o bloco "se" (Controle) com o sensor "o solo está seco?" (Sensores).',
    'Exemplo parcial: repita 6 vezes: mover para frente, se o solo está seco?: ...',
  ],
  solutionExplanation:
    'Em cada canteiro o robô perguntou "o solo está seco?". Só quando a resposta foi sim ele regou. Assim a água foi usada apenas onde era necessária.',
  referenceSolution: program([repeat(6, [act('moveForward'), ifThen(sensor('isSoilDry'), [act('water')])])]),
  commonMistakes: {
    WATER_WASTED: 'Este canteiro já estava molhado. Verifique com o sensor antes de regar.',
    NO_WATER: 'A água acabou porque o robô regou canteiros que não precisavam.',
  },
}
