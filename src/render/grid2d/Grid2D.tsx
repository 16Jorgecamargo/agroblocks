import { useEffect, useRef } from 'react'
import type { CellRef } from '@/game/missions/goals'
import type { Cell, GameState } from '@/game/world/types'
import { describeCell, FACING_LABELS } from '@/render/cellDescription'
import { registerCellLocator } from '@/render/cellLocator'
import './Grid2D.css'

interface Grid2DProps {
  state: GameState
  highlightCells: CellRef[]
  failed: boolean
}

const PLOT_GLYPHS: Record<Cell['plot'], string> = {
  untilled: '',
  tilled: '≡',
  seeded: '•',
  growing: '🌱',
  mature: '🍅',
  harvested: '✂',
}

const TERRAIN_GLYPHS: Record<Exclude<Cell['terrain'], 'soil'>, string> = {
  obstacle: '⛰',
  blocked: '✕',
  reservoir: '💧',
  seedDepot: '📦',
}

const FACING_ROTATION = { N: 0, E: 90, S: 180, W: 270 }

export function Grid2D({ state, highlightCells, failed }: Grid2DProps) {
  const highlighted = new Set(highlightCells.map(([x, y]) => `${x},${y}`))
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return registerCellLocator((x, y) => {
      const cell = gridRef.current?.querySelector<HTMLElement>(`[data-cell="${x},${y}"]`)
      if (!cell) return null
      const rect = cell.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    })
  }, [])

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Mapa da fazenda"
      className="grid2d"
      style={{ gridTemplateColumns: `repeat(${state.width}, minmax(0, 1fr))` }}
    >
      {state.cells.map((row, y) => (
        <div role="row" key={y} className="grid2d__row">
          {row.map((cell, x) => {
            const hasRobot = state.robot.x === x && state.robot.y === y
            const isGoal = highlighted.has(`${x},${y}`)
            const parts = [`coluna ${x + 1}, linha ${y + 1}: ${describeCell(cell)}`]
            if (isGoal) parts.push('objetivo')
            if (hasRobot) parts.push(`robô virado para ${FACING_LABELS[state.robot.facing]}`)
            const glyph = cell.terrain === 'soil' ? PLOT_GLYPHS[cell.plot] : TERRAIN_GLYPHS[cell.terrain]
            return (
              <div
                role="gridcell"
                key={x}
                data-cell={`${x},${y}`}
                aria-label={parts.join(', ')}
                className={[
                  'grid2d__cell',
                  `grid2d__cell--${cell.terrain}`,
                  cell.terrain === 'soil' ? `grid2d__cell--${cell.plot}` : '',
                  cell.moisture === 'wet' ? 'grid2d__cell--wet' : '',
                  isGoal ? 'grid2d__cell--goal' : '',
                ].join(' ')}
              >
                <span className="grid2d__glyph" aria-hidden="true">
                  {glyph}
                </span>
                {cell.moisture === 'wet' && cell.terrain === 'soil' && (
                  <span className="grid2d__drop" aria-hidden="true">
                    💧
                  </span>
                )}
                {hasRobot && (
                  <span
                    className={`grid2d__robot${failed ? ' grid2d__robot--failed' : ''}`}
                    style={{ transform: `rotate(${FACING_ROTATION[state.robot.facing]}deg)` }}
                    aria-hidden="true"
                  >
                    ▲
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
