import type { PageTransitionKind } from '@/motion/presets'

export function transitionFor(from: string, to: string): PageTransitionKind {
  if (from === '/missoes' && to.startsWith('/jogar/')) return 'iris'
  if (from.startsWith('/jogar/') && to === '/missoes') return 'push'
  return 'blurCrossfade'
}
