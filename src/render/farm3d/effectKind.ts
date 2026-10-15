import type { GameEvent } from '@/game/world/types'

export type EffectKind = 'soil' | 'seed' | 'water' | 'harvest'

export function effectKind(event: GameEvent): EffectKind | null {
  if (event.type === 'plotChanged' && event.to === 'tilled') return 'soil'
  if (event.type === 'plotChanged' && event.to === 'seeded') return 'seed'
  if (event.type === 'plotChanged' && event.to === 'harvested') return 'harvest'
  if (event.type === 'moistureChanged' && event.moisture === 'wet') return 'water'
  return null
}
