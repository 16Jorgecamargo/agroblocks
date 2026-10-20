import { useState, type CSSProperties } from 'react'
import { tutorialLabel, type PhaseRow, type Plot, type StudentRow } from '@/features/dashboard/dashboardModel'
import type { MissionDefinition } from '@/game/missions/missionTypes'

export type SortKey = 'name' | 'school' | 'runCount' | 'tutorial' | 'completedPhases' | 'attempts' | 'hints' | 'errors' | 'pre' | 'post' | 'gain' | 'lastSeen'

function value(row: StudentRow, key: SortKey): string | number | null {
  if (key === 'tutorial') return tutorialLabel(row.tutorial)
  return row[key]
}

export function sortStudents(rows: StudentRow[], key: SortKey, direction: 'asc' | 'desc'): StudentRow[] {
  const factor = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = value(a, key)
    const right = value(b, key)
    if (left === null && right === null) return 0
    if (left === null) return 1
    if (right === null) return -1
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor
    return String(left).localeCompare(String(right), 'pt-BR') * factor
  })
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function describePlot(title: string, plot: Plot): string {
  if (plot.state === 'empty') return `${title}: não começou`
  const tries = `${plot.attempts} ${plot.attempts === 1 ? 'tentativa' : 'tentativas'}`
  if (plot.state === 'trying') return `${title}: tentando, ${tries}`
  return `${title}: concluída com ${plot.stars} ${plot.stars === 1 ? 'estrela' : 'estrelas'}, ${tries}`
}

function Sprout() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="plot__sprout">
      <path d="M10 18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M10 11C10 7 7 5 3.5 5.5 3.5 9 6 11 10 11Z" fill="currentColor" />
      <path d="M10 9.5C10 6 12.5 3.5 16.5 4 16.5 7.5 14 9.5 10 9.5Z" fill="currentColor" />
    </svg>
  )
}

export function PlotCell({ plot, title, order }: { plot: Plot; title: string; order: number }) {
  return (
    <span className={`plot plot--${plot.state}`} style={{ '--plot-order': order } as CSSProperties} title={describePlot(title, plot)}>
      {plot.state === 'trying' && (
        <>
          <Sprout />
          <span className="plot__count" aria-hidden="true">
            {plot.attempts}
          </span>
        </>
      )}
      {plot.state === 'done' && (
        <span className="plot__stars" aria-hidden="true">
          {'★'.repeat(plot.stars)}
        </span>
      )}
      <span className="visually-hidden">{describePlot(title, plot)}</span>
    </span>
  )
}

const NUMERIC: { key: SortKey; label: string; col: string }[] = [
  { key: 'completedPhases', label: 'Fases', col: 'phases' },
  { key: 'attempts', label: 'Tentativas', col: 'attempts' },
  { key: 'hints', label: 'Dicas', col: 'hints' },
  { key: 'runCount', label: 'Jogadas', col: 'runs' },
  { key: 'lastSeen', label: 'Último acesso', col: 'last' },
]

interface ClassFieldProps {
  rows: StudentRow[]
  missions: MissionDefinition[]
  phases: PhaseRow[]
  intro: boolean
  onOpen: (row: StudentRow) => void
}

export function ClassField({ rows, missions, phases, intro, onOpen }: ClassFieldProps) {
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'lastSeen', direction: 'desc' })
  const sorted = sortStudents(rows, sort.key, sort.direction)
  const ordered = [...missions].sort((a, b) => a.order - b.order)
  const toggle = (key: SortKey) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none')
  const total = Math.max(1, rows.length)

  return (
    <div className="field-wrap">
      <table className={`class-field${intro ? ' class-field--intro' : ''}`} aria-label="Alunos">
        <thead>
          <tr>
            <th scope="col" className="class-field__who" aria-sort={ariaSort('name')}>
              <button type="button" className="sort" onClick={() => toggle('name')}>
                Aluno
              </button>
            </th>
            {ordered.map((mission) => (
              <th key={mission.id} scope="col" className="class-field__phase">
                <span className="class-field__phase-number">{mission.tutorial ? 'Treino' : `Fase ${mission.order}`}</span>
                {!mission.tutorial && <span className="class-field__phase-title">{mission.title}</span>}
              </th>
            ))}
            {NUMERIC.map((column) => (
              <th key={column.key} scope="col" className="class-field__num" aria-sort={ariaSort(column.key)}>
                <button type="button" className="sort" onClick={() => toggle(column.key)}>
                  {column.label}
                </button>
              </th>
            ))}
            <th scope="col">
              <span className="visually-hidden">Detalhes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, rowIndex) => (
            <tr key={row.key} onClick={() => onOpen(row)}>
              <th scope="row" className="class-field__who">
                <span className="class-field__name">{row.name}</span>
                <span className="class-field__school">{row.school}</span>
                <span className={`class-field__tutorial class-field__tutorial--${row.tutorial?.status ?? 'none'}`}>Tutorial: {tutorialLabel(row.tutorial)}</span>
              </th>
              {ordered.map((mission, column) => (
                <td key={mission.id} className="class-field__plot" data-col={mission.id}>
                  <PlotCell plot={row.plots[mission.id]} title={mission.title} order={rowIndex + column} />
                </td>
              ))}
              <td className="class-field__num" data-col="phases">
                {row.completedPhases}
              </td>
              <td className="class-field__num" data-col="attempts">
                {row.attempts}
              </td>
              <td className="class-field__num" data-col="hints">
                {row.hints}
              </td>
              <td className="class-field__num" data-col="runs">
                {row.runCount}
              </td>
              <td className="class-field__num class-field__date" data-col="last">
                {formatDate(row.lastSeen)}
              </td>
              <td className="class-field__open">
                <button
                  type="button"
                  className="dash-button dash-button--quiet"
                  aria-label={`Ver detalhes de ${row.name}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpen(row)
                  }}
                >
                  Abrir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="class-field__who">
              Concluíram
            </th>
            {ordered.map((mission) => {
              const done = phases.find((phase) => phase.missionId === mission.id)?.completed ?? 0
              return (
                <td key={mission.id} className="class-field__total">
                  <span className="class-field__total-value">
                    {done} de {rows.length}
                  </span>
                  <span className="meter" aria-hidden="true">
                    <span className="meter__fill" style={{ width: `${(done / total) * 100}%` }} />
                  </span>
                </td>
              )
            })}
            <td colSpan={NUMERIC.length + 1} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
