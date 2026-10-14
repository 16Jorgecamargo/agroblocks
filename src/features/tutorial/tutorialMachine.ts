import type { ExecutionSnapshot, ExecutionStatus } from '@/game/execution/types'

export type TutorialSignal = 'blockAdded' | 'blockRemoved' | 'run' | 'pause' | 'resume' | 'error' | 'success'

export interface TutorialStep {
  id: string
  text: string
  waitFor: TutorialSignal | null
  skipOn?: TutorialSignal[]
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    text: 'Este é o robô agrícola. Ele se move e trabalha seguindo, na ordem, as instruções do seu programa.',
    waitFor: null,
  },
  {
    id: 'add',
    text: 'Abra a categoria Movimento e arraste o bloco "mover para frente" para dentro de "quando executar".',
    waitFor: 'blockAdded',
  },
  {
    id: 'remove',
    text: 'Para remover um bloco, arraste-o de volta para a biblioteca ou para a lixeira. Experimente remover um.',
    waitFor: 'blockRemoved',
  },
  {
    id: 'build',
    text: 'Monte três blocos "mover para frente" e depois "colher planta". Clique em Executar e observe o robô.',
    waitFor: 'run',
  },
  {
    id: 'pause',
    text: 'Enquanto o robô anda, clique em Pausar. Depois clique em Continuar.',
    waitFor: 'resume',
    skipOn: ['error'],
  },
  {
    id: 'fix',
    text: 'Se o robô bateu na pedra, leia a explicação no console, remova um "mover para frente" e execute de novo.',
    waitFor: 'success',
  },
]

const BUILD_INDEX = TUTORIAL_STEPS.findIndex((step) => step.id === 'build')

export function advanceTutorial(index: number, signal: TutorialSignal): number {
  if (index >= TUTORIAL_STEPS.length) return index
  if (signal === 'success' && index > BUILD_INDEX) return TUTORIAL_STEPS.length
  const step = TUTORIAL_STEPS[index]
  if (step.waitFor === signal) return index + 1
  if (step.skipOn?.includes(signal)) return index + 1
  return index
}

export function statusSignal(previous: ExecutionStatus, snapshot: ExecutionSnapshot): TutorialSignal | null {
  const next = snapshot.status
  if (previous === next) return null
  if (next === 'running') return previous === 'paused' ? 'resume' : 'run'
  if (next === 'paused' && previous === 'running') return 'pause'
  if (next === 'failed') return 'error'
  if (next === 'finished') return snapshot.validation?.success ? 'success' : 'error'
  return null
}
