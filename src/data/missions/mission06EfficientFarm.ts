import { act, call, program, repeat } from '@/blocks/interpreter/programBuilder'
import { ALL_BLOCKS } from '@/blocks/blockTypes'
import { rectCells } from '@/data/missions/helpers'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import type { Program } from '@/blocks/interpreter/ast'

function farmProgram(secondTurn: 'turnLeft' | 'turnRight'): Program {
  return program(
    [
      repeat(2, [
        repeat(3, [call('cuidar'), act('moveForward')]),
        call('cuidar'),
        act('turnRight'),
        act('moveForward'),
        act('turnRight'),
        repeat(3, [call('cuidar'), act('moveForward')]),
        call('cuidar'),
        act(secondTurn),
        act('moveForward'),
        act(secondTurn),
      ]),
    ],
    { cuidar: [act('prepareSoil'), act('plant'), act('water')] },
  )
}

export const mission06EfficientFarm: MissionDefinition = {
  id: 'm6-efficient-farm',
  order: 6,
  title: 'Fazenda eficiente',
  concept: 'efficiency',
  difficulty: 3,
  briefing: {
    conceptIntro:
      'Depuração e eficiência: programas reais têm erros. Encontre o bug no programa pronto, corrija-o e use laços aninhados e procedimentos para escrever menos blocos.',
    goalText: 'Prepare, plante e regue os 16 canteiros da área 4×4 sem acabar a energia.',
  },
  map: { cells: ['. . . .', '. . . .', '. . . .', '. . . .', 'R X X S'] },
  robot: { x: 0, y: 0, facing: 'E' },
  resources: { seeds: 16, water: 16, energy: 70, seedCapacity: 16, waterCapacity: 16 },
  growTicks: 99,
  rules: {},
  allowedBlocks: ALL_BLOCKS,
  initialProgram: farmProgram('turnRight'),
  objectives: [
    { kind: 'cellsInState', cells: rectCells(0, 0, 4, 4), state: 'seeded' },
    { kind: 'cellsWet', cells: rectCells(0, 0, 4, 4) },
  ],
  efficiency: { referenceActions: 72, referenceBlocks: 19 },
  hints: [
    'O programa inicial quase funciona. Execute passo a passo e observe onde o robô sai do caminho.',
    'Depois da segunda fileira o robô precisa descer, não subir. Qual virada está errada?',
    'Compare as viradas das duas mudanças de fileira (Movimento).',
    'A segunda mudança de fileira deve usar "virar à esquerda" duas vezes, com "mover para frente" no meio.',
  ],
  solutionExplanation:
    'O procedimento "cuidar" reuniu preparar, plantar e regar. Laços aninhados percorreram as fileiras em zigue-zague. O bug estava na direção da segunda virada: com "virar à direita" o robô voltava para a fileira já plantada.',
  referenceSolution: farmProgram('turnLeft'),
  commonMistakes: {
    PLOT_OCCUPIED: 'O robô voltou a um canteiro que já foi plantado. Confira a direção das viradas entre as fileiras.',
    NO_ENERGY: 'A energia acabou. Evite passos desnecessários.',
  },
}
