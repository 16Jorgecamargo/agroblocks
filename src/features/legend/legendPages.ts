import type { Cell, Moisture, PlotState, Terrain } from '@/game/world/types'

export type LegendPageId = 'empty' | 'prepared' | 'wet' | 'planted' | 'growing' | 'ready' | 'obstacle' | 'reservoir' | 'depot' | 'goal'

export interface LegendPreview {
  terrain: Terrain
  plot: PlotState
  moisture: Moisture
  goal: boolean
}

export interface LegendPage {
  id: LegendPageId
  group: 'Solo' | 'Fazenda'
  title: string
  description: string
  reachedBy: string | null
  next: string | null
  sensor: string | null
  preview: LegendPreview
}

function soil(plot: PlotState, moisture: Moisture = 'dry', goal = false): LegendPreview {
  return { terrain: 'soil', plot, moisture, goal }
}

function element(terrain: Terrain): LegendPreview {
  return { terrain, plot: 'untilled', moisture: 'dry', goal: false }
}

export const LEGEND_PAGES: LegendPage[] = [
  {
    id: 'empty',
    group: 'Solo',
    title: 'Vazio',
    description: 'Terra lisa, sem moldura de madeira. Ainda não dá para plantar aqui: primeiro o solo precisa ser preparado.',
    reachedBy: null,
    next: 'preparar solo',
    sensor: 'o canteiro está vazio? → sim',
    preview: soil('untilled'),
  },
  {
    id: 'prepared',
    group: 'Solo',
    title: 'Preparado',
    description: 'Solo revolvido, com sulcos e moldura de madeira. Está pronto para receber uma semente.',
    reachedBy: 'preparar solo',
    next: 'plantar semente',
    sensor: 'o canteiro está vazio? → sim',
    preview: soil('tilled'),
  },
  {
    id: 'wet',
    group: 'Solo',
    title: 'Molhado',
    description: 'Terra escura com uma gota azul em cima. Plantas só crescem em solo molhado; quando a planta cresce, o solo volta a secar.',
    reachedBy: 'regar canteiro',
    next: 'aguardar: a planta cresce enquanto o robô continua trabalhando',
    sensor: 'o solo está seco? → não',
    preview: soil('tilled', 'wet'),
  },
  {
    id: 'planted',
    group: 'Solo',
    title: 'Plantado',
    description: 'Um broto de duas folhas sobre um montinho de terra. A semente só cresce se o solo estiver molhado.',
    reachedBy: 'plantar semente',
    next: 'regar canteiro',
    sensor: 'o canteiro está vazio? → não',
    preview: soil('seeded'),
  },
  {
    id: 'growing',
    group: 'Solo',
    title: 'Crescendo',
    description: 'Uma moita verde, ainda sem tomates. Ela não pode ser colhida: regue de novo para que amadureça.',
    reachedBy: 'regar canteiro com semente (ela cresce com o tempo)',
    next: 'regar canteiro',
    sensor: 'a planta está madura? → não',
    preview: soil('growing'),
  },
  {
    id: 'ready',
    group: 'Solo',
    title: 'Pronto para colher',
    description: 'Moita cheia de tomates vermelhos, com um anel dourado no chão e um brilho por cima.',
    reachedBy: 'regar canteiro crescendo (a planta amadurece com o tempo)',
    next: 'colher planta',
    sensor: 'a planta está madura? → sim',
    preview: soil('mature'),
  },
  {
    id: 'obstacle',
    group: 'Fazenda',
    title: 'Pedra',
    description: 'Bloqueia a passagem: o robô não pode entrar nesta casa.',
    reachedBy: null,
    next: 'desviar usando virar à esquerda ou virar à direita',
    sensor: 'existe obstáculo à frente? → sim',
    preview: element('obstacle'),
  },
  {
    id: 'reservoir',
    group: 'Fazenda',
    title: 'Reservatório de água',
    description: 'Caixa d’água onde o robô enche o tanque para poder regar.',
    reachedBy: null,
    next: 'coletar recursos com o robô sobre o reservatório',
    sensor: null,
    preview: element('reservoir'),
  },
  {
    id: 'depot',
    group: 'Fazenda',
    title: 'Depósito de sementes',
    description: 'Caixa com sacos de sementes para repor o estoque do robô.',
    reachedBy: null,
    next: 'coletar recursos com o robô sobre o depósito',
    sensor: 'há sementes disponíveis?',
    preview: element('seedDepot'),
  },
  {
    id: 'goal',
    group: 'Fazenda',
    title: 'Canteiro do objetivo',
    description: 'A moldura amarela marca os canteiros que a missão pede.',
    reachedBy: null,
    next: 'levar o robô até eles e fazer o que o objetivo pede',
    sensor: null,
    preview: soil('untilled', 'dry', true),
  },
]

export function legendCell(preview: LegendPreview): Cell {
  return { terrain: preview.terrain, plot: preview.plot, moisture: preview.moisture, growth: 0 }
}
