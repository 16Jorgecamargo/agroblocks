import { act, changeVar, compare, not, program, sensor, setVar, variable, whileDo } from '@/blocks/interpreter/programBuilder'
import { BARNYARD_BLOCKS } from '@/data/missions/blockSets'
import { rowCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export const barnyard10: MissionDefinition = {
  id: 'barnyard-10',
  order: 50,
  world: 'barnyard',
  slot: 10,
  title: 'Celeiro completo',
  concept: 'variables',
  difficulty: 3,
  briefing: {
    conceptIntro: 'Desafio final do Celeiro: reabasteça, conte a água e cuide de duas fileiras.',
    goalText: 'Em cada fileira: pegue água no reservatório, plante e regue os 3 canteiros contando a água, e volte. Depois desça para a segunda fileira.',
  },
  map: { cells: ['R t t t #', 'R t t t #'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: { seeds: 6, water: 0, energy: null, seedCapacity: 6, waterCapacity: 3 },
  growTicks: 99,
  rules: {},
  allowedBlocks: BARNYARD_BLOCKS,
  objectives: [{ kind: 'cellsInState', cells: [...rowCells(0, 1, 3), ...rowCells(1, 1, 3)], state: 'seeded' }, { kind: 'cellsWet', cells: [...rowCells(0, 1, 3), ...rowCells(1, 1, 3)] }],
  efficiency: { referenceActions: 33, referenceBlocks: 33 },
  hints: [
    'O tanque leva 3 de água: o suficiente para uma fileira.',
    'Comece cada fileira coletando água no reservatório.',
    'Use a variável "agua" para saber quando parar.',
    'coletar, definir agua = 3, enquanto agua > 0: mover, plantar, regar, mudar agua por -1; voltar; descer; repetir.',
  ],
  solutionExplanation: 'A variável acompanha a água do tanque; o robô volta ao reservatório antes de secar.',
  referenceSolution: program([act('collectResources'), setVar('agua', 3), whileDo(compare('GT', variable('agua'), 0), [act('moveForward'), act('plant'), act('water'), changeVar('agua', -1)]), act('turnRight'), act('turnRight'), whileDo(not(sensor('isObstacleAhead')), [act('moveForward')]), act('turnLeft'), act('moveForward'), act('turnLeft'), act('collectResources'), setVar('agua', 3), whileDo(compare('GT', variable('agua'), 0), [act('moveForward'), act('plant'), act('water'), changeVar('agua', -1)]), act('turnRight'), act('turnRight'), whileDo(not(sensor('isObstacleAhead')), [act('moveForward')])]),
}
