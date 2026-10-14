import type { Cell, GameEvent, GameState } from '@/game/world/types'

export function tickWorld(state: GameState, growTicks: number): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = []
  const cells = state.cells.map((row, y) =>
    row.map((cell, x): Cell => {
      if (cell.terrain !== 'soil' || cell.moisture !== 'wet') return cell
      if (cell.plot !== 'seeded' && cell.plot !== 'growing') return cell
      const growth = cell.growth + 1
      if (growth < growTicks) return { ...cell, growth }
      const next = cell.plot === 'seeded' ? 'growing' : 'mature'
      events.push(
        { type: 'plotChanged', x, y, from: cell.plot, to: next },
        { type: 'moistureChanged', x, y, moisture: 'dry' },
      )
      return { ...cell, plot: next, growth: 0, moisture: 'dry' }
    }),
  )
  return { state: { ...state, cells }, events }
}
