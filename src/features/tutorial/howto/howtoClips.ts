import type { HowToId } from '@/features/tutorial/tutorialTypes'

export const CLIP_NAMES = [
  'add-block',
  'snap-blocks',
  'delete-trash',
  'delete-library',
  'delete-key',
  'open-pseudocode',
  'run-stop',
  'step-mode',
  'hints',
  'error-experiment',
  'fix',
] as const

export type ClipName = (typeof CLIP_NAMES)[number]

export interface HowToClip {
  name: ClipName
  label: string
  caption: string
}

export interface HowToEntry {
  title: string
  clips: HowToClip[]
}

export const HOWTO_CLIPS: Record<HowToId, HowToEntry> = {
  'add-block': {
    title: 'Como adicionar um bloco',
    clips: [
      {
        name: 'add-block',
        label: 'Adicionar',
        caption: 'Na coluna da esquerda, clique em Movimento, segure o bloco "mover para frente" e solte logo abaixo de "quando executar".',
      },
    ],
  },
  'snap-blocks': {
    title: 'Como encaixar blocos',
    clips: [
      {
        name: 'snap-blocks',
        label: 'Encaixar',
        caption: 'Arraste outro "mover para frente" e solte logo embaixo do primeiro: ele encaixa sozinho.',
      },
    ],
  },
  'delete-block': {
    title: 'Como apagar um bloco',
    clips: [
      { name: 'delete-trash', label: 'Lixeira', caption: 'Segure o bloco e solte em cima da lixeira, no canto de baixo do editor.' },
      { name: 'delete-library', label: 'Biblioteca', caption: 'Segure o bloco e solte de volta na coluna de categorias, à esquerda.' },
      { name: 'delete-key', label: 'Tecla Delete', caption: 'Clique no bloco para selecionar e aperte a tecla Delete do teclado.' },
    ],
  },
  'open-pseudocode': {
    title: 'Como ver o pseudocódigo',
    clips: [
      {
        name: 'open-pseudocode',
        label: 'Pseudocódigo',
        caption: 'No painel da direita, clique na aba Pseudocódigo: o programa aparece escrito em texto.',
      },
    ],
  },
  'run-stop': {
    title: 'Como executar e parar',
    clips: [
      {
        name: 'run-stop',
        label: 'Executar e Parar',
        caption: 'Clique em Executar, no alto do painel da direita. Enquanto o robô anda, clique em Parar: tudo volta ao início.',
      },
    ],
  },
  'step-mode': {
    title: 'Como usar o passo a passo',
    clips: [
      {
        name: 'step-mode',
        label: 'Passo a passo',
        caption: 'Ligue a chave Passo a passo e clique em Executar: o robô faz o primeiro bloco. Depois, cada clique em Próximo faz mais um.',
      },
    ],
  },
  hints: {
    title: 'Como pedir uma dica',
    clips: [{ name: 'hints', label: 'Dicas', caption: 'No painel da direita, abra a aba Dicas e clique em "Pedir dica".' }],
  },
  'error-experiment': {
    title: 'Como fazer o experimento',
    clips: [
      {
        name: 'error-experiment',
        label: 'Experimento',
        caption: 'Com três "mover para frente", o robô passa da planta e bate na pedra. O Console, à direita, explica o erro.',
      },
    ],
  },
  fix: {
    title: 'Como corrigir o programa',
    clips: [
      {
        name: 'fix',
        label: 'Corrigir',
        caption: 'Clique no "mover para frente" a mais, aperte a tecla Delete e execute de novo: o robô colhe a planta.',
      },
    ],
  },
}

export function clipVideoPath(name: ClipName): string {
  return `howto/${name}.webm`
}

export function clipPosterPath(name: ClipName): string {
  return `howto/${name}.jpg`
}
