import { useEffect, useId, useRef, useState } from 'react'
import { itemsForForm } from '@/data/assessment/items'
import { MISSIONS } from '@/data/missions'
import { describePlot, formatDate, PlotCell } from '@/features/dashboard/ClassField'
import { scoreAssessment, tutorialLabel, type Plot, type StudentRow } from '@/features/dashboard/dashboardModel'
import { ERROR_TEXT } from '@/game/rules/errors'
import type { RunSnapshot } from '@/shared/runSnapshot'

interface StudentDetailProps {
  student: StudentRow | null
  demo: boolean
  onClose: () => void
  onDeleteRun: (runId: string) => Promise<void>
}

const OUTCOME = { success: 'Deu certo', objectiveFailed: 'Objetivo não cumprido', error: 'Parou com erro' } as const
const ordered = [...MISSIONS].sort((a, b) => a.order - b.order)
const titleOf = (missionId: string) => MISSIONS.find((mission) => mission.id === missionId)?.title ?? missionId

function runPlot(run: RunSnapshot, missionId: string): Plot {
  const progress = run.missions[missionId]
  const attempts = run.attempts.filter((attempt) => attempt.missionId === missionId).length
  const state = progress?.status === 'completed' ? 'done' : attempts > 0 ? 'trying' : 'empty'
  return { state, attempts, stars: progress?.bestResult?.efficiencyStars ?? 0, hints: progress?.hintsUsed ?? 0 }
}

function Answers({ response, label }: { response: RunSnapshot['assessments']['pre']; label: string }) {
  if (!response) return <p className="run__note">{label}: não respondida.</p>
  if (response.skipped) return <p className="run__note">{label}: pulada.</p>
  return (
    <details className="run__answers">
      <summary>
        {label}: {scoreAssessment(response)} de 10
      </summary>
      <ol>
        {itemsForForm(response.form).map((item) => {
          const answer = response.answers[item.id]
          const right = answer === item.correctIndex
          return (
            <li key={item.id} className={right ? 'answer answer--right' : 'answer answer--wrong'}>
              <span className="answer__mark" aria-label={right ? 'correta' : 'errada'}>
                {right ? '✓' : '✗'}
              </span>
              <span>
                {item.prompt} <strong>{answer === undefined ? 'sem resposta' : item.options[answer] ?? String(answer)}</strong>
              </span>
            </li>
          )
        })}
      </ol>
    </details>
  )
}

function RunSection({ run, demo, onDelete }: { run: RunSnapshot; demo: boolean; onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <section className="run">
      <header className="run__head">
        <h3>Jogada de {formatDate(run.createdAt)}</h3>
        <p className="run__note">
          Tutorial: {tutorialLabel(run.tutorial)}
          {run.tutorial && ` (${formatDate(run.tutorial.at)})`}
        </p>
      </header>
      <ul className="run__plots">
        {ordered.map((mission, index) => {
          const plot = runPlot(run, mission.id)
          return (
            <li key={mission.id} className="run__plot" title={describePlot(mission.title, plot)}>
              <PlotCell plot={plot} title={mission.title} order={index} />
              <span className="run__plot-label" aria-hidden="true">
                {mission.tutorial ? 'Treino' : mission.order}
              </span>
            </li>
          )
        })}
      </ul>
      <h4>Tentativas</h4>
      {run.attempts.length === 0 ? (
        <p className="run__note">Nenhuma tentativa ainda.</p>
      ) : (
        <ol className="attempts">
          {run.attempts.map((attempt) => (
            <li key={attempt.id} className={`attempt attempt--${attempt.outcome}`}>
              <span className="attempt__when">{formatDate(attempt.timestamp)}</span>
              <span className="attempt__what">
                <strong>{titleOf(attempt.missionId)}</strong>
                <span className="attempt__outcome">{OUTCOME[attempt.outcome]}</span>
                {attempt.errorCode && <span className="attempt__error">{ERROR_TEXT[attempt.errorCode as keyof typeof ERROR_TEXT]?.message ?? attempt.errorCode}</span>}
              </span>
              <details className="attempt__code">
                <summary>Pseudocódigo</summary>
                <pre>{attempt.pseudocode || '(vazio)'}</pre>
              </details>
            </li>
          ))}
        </ol>
      )}
      <h4>Avaliações</h4>
      <Answers response={run.assessments.pre} label="Avaliação pré" />
      <Answers response={run.assessments.post} label="Avaliação pós" />
      {!demo && !confirming && (
        <button type="button" className="dash-button dash-button--danger-quiet run__delete" onClick={() => setConfirming(true)}>
          Apagar jogada
        </button>
      )}
      {!demo && confirming && (
        <div className="run__confirm" role="alertdialog" aria-label="Apagar jogada">
          <p>Apagar esta jogada? Esta ação não pode ser desfeita.</p>
          <div className="run__confirm-actions">
            <button type="button" className="dash-button dash-button--quiet" onClick={() => setConfirming(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="dash-button dash-button--danger"
              onClick={() => {
                setConfirming(false)
                void onDelete()
              }}
            >
              Apagar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export function StudentDetail({ student, demo, onClose, onDeleteRun }: StudentDetailProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnRef = useRef<Element | null>(null)
  const open = student !== null

  useEffect(() => {
    if (!open) return
    returnRef.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (returnRef.current instanceof HTMLElement) returnRef.current.focus()
    }
  }, [open, onClose])

  if (!student) return null
  return (
    <div className="drawer">
      <div className="drawer__backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="drawer__head">
          <div>
            <h2 id={titleId} className="drawer__title">
              {student.name}
            </h2>
            <p className="drawer__meta">
              {student.school}, {student.runCount} {student.runCount === 1 ? 'jogada' : 'jogadas'}
            </p>
          </div>
          <button ref={closeRef} type="button" className="dash-button dash-button--quiet" onClick={onClose}>
            Fechar
          </button>
        </header>
        <div className="drawer__body">
          {student.runs.map((run) => (
            <RunSection key={run.runId} run={run} demo={demo} onDelete={() => onDeleteRun(run.runId)} />
          ))}
        </div>
      </aside>
    </div>
  )
}
