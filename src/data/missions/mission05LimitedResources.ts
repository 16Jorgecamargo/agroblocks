import { act, changeVar, compare, ifThen, program, repeat, setVar, variable } from '@/blocks/interpreter/programBuilder'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const mission05LimitedResources: MissionDefinition = {
  id: 'm5-limited-resources',
  order: 5,
  title: 'Recursos limitados',
  concept: 'variables',
  difficulty: 3,
  briefing: {
    conceptIntro:
      'Variáveis guardam valores que mudam durante o programa, como quantos canteiros já foram regados. Com elas o robô sabe a hora de voltar ao reservatório.',
    goalText: 'Plante e regue os 6 canteiros. O tanque do robô começa vazio e só carrega 3 de água por vez.',
  },
  map: { cells: ['X X X X X X X X', 'R t t t t t t #', 'X X X X X X X X'] },
  robot: { x: 0, y: 1, facing: 'E' },
  resources: { seeds: 6, water: 0, energy: null, seedCapacity: 6, waterCapacity: 3 },
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
    'farm_collect',
    'sensor_plot_empty',
    'sensor_soil_dry',
    'sensor_plant_mature',
    'sensor_obstacle_ahead',
    'sensor_has_seeds',
    'controls_repeat_ext',
    'controls_whileUntil',
    'controls_if',
    'logic_compare',
    'logic_operation',
    'logic_negate',
    'math_number',
    'math_arithmetic',
    'variables_set',
    'variables_get',
    'math_change',
  ],
  objectives: [
    { kind: 'cellsInState', cells: rowCells(1, 1, 6), state: 'seeded' },
    { kind: 'cellsWet', cells: rowCells(1, 1, 6) },
  ],
  constraints: [
    { kind: 'maxWaterUsed', value: 6 },
    { kind: 'maxSeedsUsed', value: 6 },
  ],
  efficiency: { referenceActions: 30, referenceBlocks: 21 },
  hints: [
    'O tanque não dá para todos os canteiros. Em algum momento o robô precisa voltar ao reservatório.',
    'Conte quantos canteiros já foram regados. Quando a conta chegar a 3, é hora de reabastecer.',
    'Crie uma variável (Variáveis) e use "se" com o bloco de comparação (Controle).',
    'Exemplo parcial: coletar recursos, plantados ← 0, repita 6 vezes: mover, plantar, regar, plantados ← plantados + 1, se plantados = 3: ...',
  ],
  solutionExplanation:
    'A variável contou os canteiros cuidados. Quando chegou a 3, o robô deu meia-volta, reabasteceu no reservatório e voltou ao ponto onde parou. Sem a variável ele não saberia quando a água acabaria.',
  referenceSolution: program([
    act('collectResources'),
    setVar('plantados', 0),
    repeat(6, [
      act('moveForward'),
      act('plant'),
      act('water'),
      changeVar('plantados', 1),
      ifThen(compare('EQ', variable('plantados'), 3), [
        act('turnLeft'),
        act('turnLeft'),
        repeat(3, [act('moveForward')]),
        act('collectResources'),
        act('turnLeft'),
        act('turnLeft'),
        repeat(3, [act('moveForward')]),
      ]),
    ]),
  ]),
  commonMistakes: {
    NO_WATER: 'O tanque esvaziou. Comece coletando água e volte ao reservatório a cada 3 regas.',
    NOT_AT_SUPPLY: 'O robô só coleta água em cima do reservatório.',
  },
}
