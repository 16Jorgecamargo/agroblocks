import type { DashboardModel } from '@/features/dashboard/dashboardModel'

const decimal = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

export function ErrorList({ errors }: { errors: DashboardModel['topErrors'] }) {
  if (errors.length === 0) return <p className="insight__empty">Nenhum programa parou com erro até agora.</p>
  const max = Math.max(...errors.map((error) => error.count))
  return (
    <ol className="error-list">
      {errors.map((error) => (
        <li key={error.code} className="error-list__item">
          <span className="error-list__label">{error.label}</span>
          <span className="error-list__count">{error.count}×</span>
          <span className="meter meter--wide" aria-hidden="true">
            <span className="meter__fill meter__fill--soil" style={{ width: `${(error.count / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ol>
  )
}

export function ScoreRanges({ rows }: { rows: DashboardModel['worldRows'] }) {
  return (
    <div className="scores">
      <p className="scores__legend" aria-hidden="true">
        <span className="scores__key scores__key--pre" /> Pré-teste <span className="scores__key scores__key--post" /> Pós-teste
      </p>
      <ul className="scores__list">
        {rows.map((row) => {
          const low = Math.min(row.pre ?? row.post ?? 0, row.post ?? row.pre ?? 0)
          const high = Math.max(row.pre ?? row.post ?? 0, row.post ?? row.pre ?? 0)
          const text = `${row.name}: pré ${row.pre === null ? 'sem dados' : decimal(row.pre)}, pós ${row.post === null ? 'sem dados' : decimal(row.post)}`
          return (
            <li key={row.name} className="scores__row">
              <span className="scores__school">{row.name}</span>
              <span className="scores__track" role="img" aria-label={text}>
                {row.pre !== null && row.post !== null && <span className="scores__span" style={{ left: `${low * 10}%`, width: `${(high - low) * 10}%` }} />}
                {row.pre !== null && <span className="scores__dot scores__dot--pre" style={{ left: `${row.pre * 10}%` }} />}
                {row.post !== null && <span className="scores__dot scores__dot--post" style={{ left: `${row.post * 10}%` }} />}
              </span>
              <span className="scores__values" aria-hidden="true">
                {row.pre === null ? '—' : decimal(row.pre)} → {row.post === null ? '—' : decimal(row.post)}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="scores__row scores__row--axis" aria-hidden="true">
        <span />
        <span className="scores__axis">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </span>
        <span className="scores__values">acertos</span>
      </div>
    </div>
  )
}

export function WorldEffort({ phases }: { phases: DashboardModel['worldRows'] }) {
  const max = Math.max(1, ...phases.map((phase) => Math.max(phase.attemptsPerStudent, phase.hintsPerStudent)))
  return (
    <ul className="effort">
      {phases.map((phase) => (
        <li key={phase.world} className="effort__row">
          <span className="effort__title">{phase.name}</span>
          <span className="effort__bars">
            <span className="effort__bar">
              <span className="meter meter--wide" aria-hidden="true">
                <span className="meter__fill" style={{ width: `${(phase.attemptsPerStudent / max) * 100}%` }} />
              </span>
              <span className="effort__value">{decimal(phase.attemptsPerStudent)} tentativas</span>
            </span>
            <span className="effort__bar">
              <span className="meter meter--wide" aria-hidden="true">
                <span className="meter__fill meter__fill--water" style={{ width: `${(phase.hintsPerStudent / max) * 100}%` }} />
              </span>
              <span className="effort__value">{decimal(phase.hintsPerStudent)} dicas</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
