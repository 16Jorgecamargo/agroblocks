import type { ErrorCode, GameEvent, GameState } from '@/game/world/types'

export type HandlerOutcome = { state: GameState; events: GameEvent[] } | { error: ErrorCode }
