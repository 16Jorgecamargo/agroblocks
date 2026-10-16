import type { HowToBeat, HowToScript, Point } from '@/features/tutorial/howto/howtoTypes'
import {
  CATEGORY_POINTS,
  flyoutBlockAt,
  HARVEST,
  HINT_BUTTON_POINT,
  KEY_POINT,
  MOVE,
  RUN_POINT,
  stackBlockAt,
  STEP_TOGGLE_POINT,
  TAB_POINTS,
  TRASH_POINT,
} from '@/features/tutorial/howto/replicaLayout'
import type { HowToId } from '@/features/tutorial/tutorialTypes'

const REST: Point = { x: 330, y: 250 }
const SIDE_REST: Point = { x: 470, y: 280 }

function grab(point: Point): Point {
  return { x: point.x + 15, y: point.y }
}

function idle(at: number, point: Point, set?: HowToBeat['set']): HowToBeat {
  return { at, hand: { ...point, mode: 'idle' }, set }
}

function press(at: number, point: Point, set?: HowToBeat['set']): HowToBeat {
  return { at, hand: { ...point, mode: 'press' }, set }
}

function drag(at: number, point: Point, set?: HowToBeat['set']): HowToBeat {
  return { at, hand: { ...point, mode: 'drag' }, set }
}

function openMovementAndDrag(start: number, dropAt: Point, stackAfter: string[]): HowToBeat[] {
  return [
    idle(start, CATEGORY_POINTS.movement),
    press(start + 300, CATEGORY_POINTS.movement, { toolboxOpen: true }),
    idle(start + 600, CATEGORY_POINTS.movement),
    idle(start + 1100, grab(flyoutBlockAt(0))),
    drag(start + 1400, grab(flyoutBlockAt(0)), { dragging: MOVE }),
    drag(start + 2400, grab(dropAt)),
    idle(start + 2700, grab(dropAt), { dragging: null, stack: stackAfter, toolboxOpen: false }),
  ]
}

export const HOWTO_SCRIPTS: Record<HowToId, HowToScript> = {
  'add-block': {
    id: 'add-block',
    title: 'Como adicionar um bloco',
    parts: ['toolbox', 'workspace', 'trash'],
    segments: [
      {
        label: 'Adicionar',
        caption: 'Clique em Movimento, segure o bloco "mover para frente" e solte dentro de "quando executar".',
        lengthMs: 4200,
        initial: { stack: [] },
        beats: [idle(0, REST), ...openMovementAndDrag(600, stackBlockAt(0), [MOVE]), idle(4200, REST)],
      },
    ],
  },
  'snap-blocks': {
    id: 'snap-blocks',
    title: 'Como encaixar blocos',
    parts: ['toolbox', 'workspace', 'trash'],
    segments: [
      {
        label: 'Encaixar',
        caption: 'Arraste outro bloco e solte logo embaixo do primeiro: ele encaixa sozinho.',
        lengthMs: 4200,
        initial: { stack: [MOVE] },
        beats: [idle(0, REST), ...openMovementAndDrag(600, stackBlockAt(1), [MOVE, MOVE]), idle(4200, REST)],
      },
    ],
  },
  'delete-block': {
    id: 'delete-block',
    title: 'Como apagar um bloco',
    parts: ['toolbox', 'workspace', 'trash', 'key'],
    segments: [
      {
        label: 'Lixeira',
        caption: 'Arraste o bloco até a lixeira e solte.',
        lengthMs: 3400,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(600, grab(stackBlockAt(1))),
          drag(900, grab(stackBlockAt(1)), { dragging: MOVE, stack: [MOVE] }),
          drag(2000, TRASH_POINT, { trashOpen: true }),
          idle(2300, TRASH_POINT, { dragging: null, trashOpen: false }),
          idle(3400, REST),
        ],
      },
      {
        label: 'Biblioteca',
        caption: 'Ou arraste o bloco de volta para as categorias, à esquerda.',
        lengthMs: 3400,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(600, grab(stackBlockAt(1))),
          drag(900, grab(stackBlockAt(1)), { dragging: MOVE, stack: [MOVE] }),
          drag(2000, { x: 45, y: 150 }),
          idle(2300, { x: 45, y: 150 }, { dragging: null }),
          idle(3400, REST),
        ],
      },
      {
        label: 'Delete',
        caption: 'Ou clique no bloco para selecionar e aperte a tecla Delete.',
        lengthMs: 3400,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(600, grab(stackBlockAt(1))),
          press(900, grab(stackBlockAt(1)), { selected: 1 }),
          idle(1200, grab(stackBlockAt(1))),
          idle(1700, KEY_POINT),
          press(2000, KEY_POINT, { keyDown: true }),
          idle(2250, KEY_POINT, { keyDown: false, stack: [MOVE], selected: null }),
          idle(3400, REST),
        ],
      },
    ],
  },
  'open-pseudocode': {
    id: 'open-pseudocode',
    title: 'Como ver o pseudocódigo',
    parts: ['workspace', 'side'],
    segments: [
      {
        label: 'Pseudocódigo',
        caption: 'Clique na aba Pseudocódigo: o programa aparece escrito em texto.',
        lengthMs: 2800,
        initial: { stack: [MOVE] },
        beats: [idle(0, SIDE_REST), idle(700, TAB_POINTS.pseudocode), press(1000, TAB_POINTS.pseudocode, { tab: 'pseudocode' }), idle(1300, TAB_POINTS.pseudocode), idle(2800, SIDE_REST)],
      },
    ],
  },
  'run-stop': {
    id: 'run-stop',
    title: 'Como executar e parar',
    parts: ['workspace', 'run', 'farm'],
    segments: [
      {
        label: 'Executar e Parar',
        caption: 'Clique em Executar. Enquanto o robô anda, clique em Parar: tudo volta ao início.',
        lengthMs: 5200,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(700, RUN_POINT),
          press(1000, RUN_POINT, { run: 'running', highlight: 0 }),
          idle(1300, RUN_POINT),
          idle(2300, RUN_POINT, { robotCell: 1, highlight: 1 }),
          press(3000, RUN_POINT, { run: 'idle', robotCell: 0, highlight: null }),
          idle(3300, RUN_POINT),
          idle(5200, SIDE_REST),
        ],
      },
    ],
  },
  'step-mode': {
    id: 'step-mode',
    title: 'Como usar o passo a passo',
    parts: ['workspace', 'run', 'farm'],
    segments: [
      {
        label: 'Passo a passo',
        caption: 'Ligue Passo a passo e clique em Próximo: o robô faz um bloco por clique.',
        lengthMs: 5600,
        initial: { stack: [MOVE, MOVE] },
        beats: [
          idle(0, REST),
          idle(700, STEP_TOGGLE_POINT),
          press(1000, STEP_TOGGLE_POINT, { stepMode: true }),
          idle(1300, STEP_TOGGLE_POINT),
          idle(1900, RUN_POINT),
          press(2200, RUN_POINT, { run: 'stepping', robotCell: 1, highlight: 0 }),
          idle(2500, RUN_POINT),
          press(3300, RUN_POINT, { robotCell: 2, highlight: 1 }),
          idle(3600, RUN_POINT),
          idle(5600, SIDE_REST),
        ],
      },
    ],
  },
  hints: {
    id: 'hints',
    title: 'Como pedir uma dica',
    parts: ['side'],
    segments: [
      {
        label: 'Dicas',
        caption: 'Abra a aba Dicas e clique em "Pedir dica".',
        lengthMs: 3800,
        initial: {},
        beats: [
          idle(0, SIDE_REST),
          idle(700, TAB_POINTS.hints),
          press(1000, TAB_POINTS.hints, { tab: 'hints' }),
          idle(1300, TAB_POINTS.hints),
          idle(1900, HINT_BUTTON_POINT),
          press(2200, HINT_BUTTON_POINT, { hintsShown: 1 }),
          idle(2500, HINT_BUTTON_POINT),
          idle(3800, SIDE_REST),
        ],
      },
    ],
  },
  'error-experiment': {
    id: 'error-experiment',
    title: 'Experimento: andar demais',
    parts: ['workspace', 'run', 'farm', 'side'],
    segments: [
      {
        label: 'Experimento',
        caption: 'Com três "mover para frente", o robô passa da planta e bate na pedra. O Console explica o erro.',
        lengthMs: 5800,
        initial: { stack: [MOVE, MOVE, MOVE, HARVEST] },
        beats: [
          idle(0, REST),
          idle(700, RUN_POINT),
          press(1000, RUN_POINT, { run: 'running', highlight: 0 }),
          idle(1300, RUN_POINT),
          idle(1900, RUN_POINT, { robotCell: 1, highlight: 1 }),
          idle(2500, RUN_POINT, { robotCell: 2, highlight: 2 }),
          idle(3100, RUN_POINT, { robotHit: true, run: 'idle', highlight: null, tab: 'console', consoleLines: ['O robô bateu na pedra.'] }),
          idle(5800, SIDE_REST),
        ],
      },
    ],
  },
  fix: {
    id: 'fix',
    title: 'Como corrigir o programa',
    parts: ['workspace', 'trash', 'key', 'run', 'farm'],
    segments: [
      {
        label: 'Corrigir',
        caption: 'Selecione um "mover para frente" a mais, aperte Delete e execute de novo: o robô colhe a planta.',
        lengthMs: 6400,
        initial: { stack: [MOVE, MOVE, MOVE, HARVEST] },
        beats: [
          idle(0, REST),
          idle(600, grab(stackBlockAt(2))),
          press(900, grab(stackBlockAt(2)), { selected: 2 }),
          idle(1200, grab(stackBlockAt(2))),
          idle(1700, KEY_POINT),
          press(2000, KEY_POINT, { keyDown: true }),
          idle(2250, KEY_POINT, { keyDown: false, stack: [MOVE, MOVE, HARVEST], selected: null }),
          idle(2900, RUN_POINT),
          press(3200, RUN_POINT, { run: 'running', highlight: 0 }),
          idle(3500, RUN_POINT),
          idle(4000, RUN_POINT, { robotCell: 1, highlight: 1 }),
          idle(4600, RUN_POINT, { robotCell: 2, highlight: 2 }),
          idle(5200, RUN_POINT, { harvested: true, run: 'idle', highlight: null }),
          idle(6400, SIDE_REST),
        ],
      },
    ],
  },
}
