import { useState } from 'react'
import { tutorialLabel, type StudentRow } from '@/features/dashboard/dashboardModel'

export type SortKey = 'name' | 'school' | 'runCount' | 'tutorial' | 'completedPhases' | 'attempts' | 'hints' | 'errors' | 'pre' | 'post' | 'gain' | 'lastSeen'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'school', label: 'Escola' },
  { key: 'runCount', label: 'Jogadas' },
  { key: 'tutorial', label: 'Tutorial' },
  { key: 'completedPhases', label: 'Fases' },
  { key: 'attempts', label: 'Tentativas' },
  { key: 'hints', label: 'Dicas' },
  { key: 'errors', label: 'Erros' },
  { key: 'pre', label: 'Pré' },
  { key: 'post', label: 'Pós' },
  { key: 'gain', label: 'Ganho' },
  { key: 'lastSeen', label: 'Último acesso' },
]

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

const show = (score: number | null) => (score === null ? '—' : String(score))

export function StudentTable({ rows, onOpen }: { rows: StudentRow[]; onOpen: (row: StudentRow) => void }) {
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'lastSeen', direction: 'desc' })
  const sorted = sortStudents(rows, sort.key, sort.direction)
  const toggle = (key: SortKey) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
  return (
    <div className="card dashboard__table-wrap">
      <table className="dashboard__table">
        <caption>Alunos</caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.key} scope="col" aria-sort={sort.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className="dashboard__sort" onClick={() => toggle(column.key)}>
                  {column.label}
                </button>
              </th>
            ))}
            <th scope="col">
              <span className="visually-hidden">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.name}</th>
              <td>{row.school}</td>
              <td>{row.runCount}</td>
              <td>{tutorialLabel(row.tutorial)}</td>
              <td>{row.completedPhases}</td>
              <td>{row.attempts}</td>
              <td>{row.hints}</td>
              <td>{row.errors}</td>
              <td>{show(row.pre)}</td>
              <td>{show(row.post)}</td>
              <td>{row.gain === null ? '—' : row.gain > 0 ? `+${row.gain}` : String(row.gain)}</td>
              <td>{formatDate(row.lastSeen)}</td>
              <td>
                <button type="button" className="button" onClick={() => onOpen(row)} aria-label={`Ver detalhes de ${row.name}`}>
                  Detalhes
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
