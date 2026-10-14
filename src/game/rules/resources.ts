import type { GameEvent, GameState, ResourceKey, Resources } from '@/game/world/types'

type SpendableKey = 'seeds' | 'water' | 'energy'

export function canSpend(resources: Resources, key: SpendableKey, amount: number): boolean {
  const current = resources[key]
  return current === null || current >= amount
}

export function spend(state: GameState, key: SpendableKey, amount: number): GameState {
  const current = state.resources[key]
  return {
    ...state,
    resources: { ...state.resources, [key]: current === null ? null : current - amount },
    usage: { ...state.usage, [key]: state.usage[key] + amount },
  }
}

const RESOURCE_KEYS: ResourceKey[] = ['seeds', 'water', 'energy', 'harvested']

export function resourceEvents(before: Resources, after: Resources): GameEvent[] {
  return RESOURCE_KEYS.filter((key) => before[key] !== after[key]).map((key) => ({
    type: 'resourceChanged' as const,
    resource: key,
    value: after[key],
  }))
}
