import { act, ifThen, not, program, sensor, whileDo } from '@/blocks/interpreter/programBuilder'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { UNLIMITED_RESOURCES } from '@/game/world/createInitialState'

const harvestRow = () =>
  whileDo(not(sensor('isObstacleAhead')), [act('moveForward'), ifThen(sensor('isPlantMature'), [act('harvest')])])

export const greenhouse03: MissionDefinition = {
  id: 'greenhouse-03',
  order: 33,
  world: 'greenhouse',
  slot: 3,
  title: 'Colheita automatizada',
  concept: 'sensors',
  difficulty: 2,
  briefing: {
    conceptIntro:
      'Sensores + laço "enquanto": o robô repete os comandos enquanto uma condição for verdadeira, sem você precisar contar as casas.',
    goalText: 'Colha as 7 plantas maduras das duas fileiras sem tocar nas que ainda estão crescendo.',
  },
  map: { cells: ['X X X X X X X X', '. m g m m g m #', '. g m g m m g #', 'X X X X X X X X'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: UNLIMITED_RESOURCES,
  growTicks: 50,
  rules: {},
  allowedBlocks: [
    'robot_move_forward',
    'robot_turn_left',
    'robot_turn_right',
    'farm_prepare_soil',
    'farm_plant',
    'farm_water',
    'farm_harvest',
    'sensor_plot_empty',
    'sensor_soil_dry',
    'sensor_plant_mature',
    'sensor_obstacle_ahead',
    'controls_repeat_ext',
    'controls_whileUntil',
    'controls_if',
    'logic_negate',
  ],
  objectives: [{ kind: 'harvestAtLeast', count: 7 }],
  efficiency: { referenceActions: 22, referenceBlocks: 17 },
  hints: [
    'Algumas plantas ainda não estão prontas. O robô precisa verificar cada uma.',
    'Duas perguntas importam: a planta está madura? existe obstáculo à frente?',
    'Combine "enquanto" com "não" e o sensor de obstáculo; dentro, use "se" com o sensor de maturidade.',
    'Exemplo parcial: enquanto não (existe obstáculo à frente?): mover para frente, se a planta está madura?: colher planta',
  ],
  solutionExplanation:
    'O laço "enquanto" fez o robô andar até a cerca sem contar casas. Em cada canteiro o sensor de maturidade decidiu se ele colhia. Depois o robô desceu para a segunda fileira e repetiu a mesma lógica.',
  referenceSolution: program([harvestRow(), act('turnRight'), act('moveForward'), act('turnRight'), harvestRow()]),
  commonMistakes: {
    PLANT_NOT_MATURE: 'Esta planta ainda está crescendo. Use o sensor "a planta está madura?" antes de colher.',
    HIT_OBSTACLE: 'O robô chegou na cerca. Use o sensor de obstáculo para saber quando parar.',
  },
}
