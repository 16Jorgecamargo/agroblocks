import { useId } from 'react'

interface BarValue {
  name: string
  value: number | null
  tone: 'primary' | 'secondary'
}

interface BarChartProps {
  title: string
  description: string
  series: { label: string; values: BarValue[] }[]
  max: number
  unit?: string
}

const ROW_HEIGHT = 30
const LABEL_WIDTH = 190
const CHART_WIDTH = 520

export function BarChart({ title, description, series, max, unit = '' }: BarChartProps) {
  const titleId = useId()
  const descId = useId()
  const barsPerRow = Math.max(1, ...series.map((row) => row.values.length))
  const rowHeight = ROW_HEIGHT * barsPerRow + 10
  const height = series.length * rowHeight + 10
  const scale = (value: number) => (max <= 0 ? 0 : (value / max) * (CHART_WIDTH - LABEL_WIDTH - 140))
  return (
    <figure className="bar-chart">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} role="img" aria-labelledby={`${titleId} ${descId}`} className="bar-chart__svg">
        <title id={titleId}>{title}</title>
        <desc id={descId}>{description}</desc>
        {series.map((row, rowIndex) => {
          const y = rowIndex * rowHeight + 10
          return (
            <g key={row.label}>
              <text x={0} y={y + (rowHeight - 10) / 2 + 4} className="bar-chart__label">
                {row.label.length > 26 ? `${row.label.slice(0, 25)}…` : row.label}
              </text>
              {row.values.map((bar, barIndex) => {
                const barY = y + barIndex * ROW_HEIGHT
                const width = bar.value === null ? 0 : Math.max(2, scale(bar.value))
                return (
                  <g key={bar.name}>
                    <rect x={LABEL_WIDTH} y={barY} width={width} height={ROW_HEIGHT - 8} rx={4} className={`bar-chart__bar bar-chart__bar--${bar.tone}`} />
                    <text x={LABEL_WIDTH + width + 6} y={barY + ROW_HEIGHT / 2 + 1} className="bar-chart__value">
                      {bar.value === null ? `${bar.name}: sem dados` : `${bar.name}: ${bar.value}${unit}`}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      <figcaption>{title}</figcaption>
    </figure>
  )
}
