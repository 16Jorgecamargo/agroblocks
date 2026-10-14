import type { AssessmentItem } from '@/game/assessment/types'
import { FACING_LABELS } from '@/render/cellDescription'

const ROTATION = { N: 0, E: 90, S: 180, W: 270 }

export function MiniGrid({ grid }: { grid: NonNullable<AssessmentItem['grid']> }) {
  const { robot } = grid
  return (
    <figure className="mini-grid-figure">
      <div className="mini-grid" style={{ gridTemplateColumns: `repeat(${grid.width}, 36px)` }} aria-hidden="true">
        {Array.from({ length: grid.width * grid.height }, (_, index) => {
          const x = index % grid.width
          const y = Math.floor(index / grid.width)
          const here = robot.x === x && robot.y === y
          return (
            <span key={index} className="mini-grid__cell">
              {here && (
                <span className="mini-grid__robot" style={{ transform: `rotate(${ROTATION[robot.facing]}deg)` }}>
                  ▲
                </span>
              )}
            </span>
          )
        })}
      </div>
      <figcaption>
        Grade {grid.width}×{grid.height}. Robô na coluna {robot.x + 1}, linha {robot.y + 1}, virado para {FACING_LABELS[robot.facing]}.
      </figcaption>
    </figure>
  )
}
