import { useState } from 'react'
import { GameButton } from '@/components/game/GameButton'
import { DialogSection, GameDialog } from '@/components/game/GameDialog'
import { itemsForForm } from '@/data/assessment/items'
import { MISSIONS } from '@/data/missions'
import { scoreAssessment, tutorialLabel, type StudentRow } from '@/features/dashboard/dashboardModel'
import { formatDate } from '@/features/dashboard/StudentTable'
import { ERROR_TEXT } from '@/game/rules/errors'
import type { RunSnapshot } from '@/shared/runSnapshot'

interface StudentDetailProps {
  student: StudentRow | null
  demo: boolean
  onClose: () => void
  onDeleteRun: (runId: string) => Promise<void>
}

const STATUS = { completed: 'Concluída', available: 'Disponível', locked: 'Bloqueada' } as const
const OUTCOME = { success: 'Sucesso', objectiveFailed: 'Objetivo não cumprido', error: 'Erro' } as const
const ordered = [...MISSIONS].sort((a, b) => a.order - b.order)
const titleOf = (missionId: string) => MISSIONS.find((mission) => mission.id === missionId)?.title ?? missionId

function Answers({ response, label }: { response: RunSnapshot['assessments']['pre']; label: string }) {
  if (!response) return <p>{label}: não respondida.</p>
  if (response.skipped) return <p>{label}: pulada.</p>
  return (
    <div>
      <h4>
        {label} — {scoreAssessment(response)} de 10
      </h4>
      <ol className="student-detail__answers">
        {itemsForForm(response.form).map((item) => {
          const answer = response.answers[item.id]
          return (
            <li key={item.id}>
              <span>{item.prompt}</span> <strong>{answer === undefined ? 'sem resposta' : item.options[answer] ?? String(answer)}</strong> <span aria-label={answer === item.correctIndex ? 'correta' : 'errada'}>{answer === item.correctIndex ? '✓' : '✗'}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function RunSection({ run, demo, onDelete }: { run: RunSnapshot; demo: boolean; onDelete: () => void }) {
  return (
    <section className="student-detail__run">
      <h3>Jogada de {formatDate(run.createdAt)}</h3>
      <p>
        Tutorial: {tutorialLabel(run.tutorial)}
        {run.tutorial && ` (${formatDate(run.tutorial.at)})`}
      </p>
      <table className="dashboard__table">
        <caption>Fases</caption>
        <thead>
          <tr>
            <th scope="col">Fase</th>
            <th scope="col">Situação</th>
            <th scope="col">Tentativas</th>
            <th scope="col">Melhor</th>
            <th scope="col">Estrelas</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((mission) => {
            const progress = run.missions[mission.id]
            return (
              <tr key={mission.id}>
                <th scope="row">{mission.title}</th>
                <td>{progress ? STATUS[progress.status] : '—'}</td>
                <td>{progress?.attempts ?? 0}</td>
                <td>{progress?.bestResult ? `${progress.bestResult.actions} comandos` : '—'}</td>
                <td>{progress?.bestResult ? '★'.repeat(progress.bestResult.efficiencyStars) : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <h4>Tentativas</h4>
      {run.attempts.length === 0 ? (
        <p>Nenhuma tentativa.</p>
      ) : (
        <ol className="student-detail__attempts">
          {run.attempts.map((attempt) => (
            <li key={attempt.id}>
              <span>
                {formatDate(attempt.timestamp)} · {titleOf(attempt.missionId)} · {OUTCOME[attempt.outcome]}
                {attempt.errorCode && ` · ${ERROR_TEXT[attempt.errorCode as keyof typeof ERROR_TEXT]?.message ?? attempt.errorCode}`}
              </span>
              <details>
                <summary>Pseudocódigo</summary>
                <pre>{attempt.pseudocode || '(vazio)'}</pre>
              </details>
            </li>
          ))}
        </ol>
      )}
      <Answers response={run.assessments.pre} label="Avaliação pré" />
      <Answers response={run.assessments.post} label="Avaliação pós" />
      {!demo && (
        <GameButton tone="danger" icon="trash" onClick={onDelete}>
          Apagar jogada
        </GameButton>
      )}
    </section>
  )
}

export function StudentDetail({ student, demo, onClose, onDeleteRun }: StudentDetailProps) {
  const [confirm, setConfirm] = useState<string | null>(null)
  return (
    <>
      <GameDialog open={student !== null} title={student?.name ?? ''} icon="chart" tone="info" size="xl" onClose={onClose}>
        <DialogSection className="student-detail">
          {student && (
            <>
              <p>
                {student.school} · {student.runCount} {student.runCount === 1 ? 'jogada' : 'jogadas'}
              </p>
              {student.runs.map((run) => (
                <RunSection key={run.runId} run={run} demo={demo} onDelete={() => setConfirm(run.runId)} />
              ))}
            </>
          )}
        </DialogSection>
      </GameDialog>
      <GameDialog open={confirm !== null} title="Apagar jogada" icon="trash" tone="danger" onClose={() => setConfirm(null)}>
        <DialogSection>
          <p>Apagar esta jogada? Esta ação não pode ser desfeita.</p>
        </DialogSection>
        <DialogSection className="game-dialog__actions">
          <GameButton tone="secondary" onClick={() => setConfirm(null)}>
            Cancelar
          </GameButton>
          <GameButton
            tone="danger"
            onClick={() => {
              const runId = confirm
              setConfirm(null)
              if (runId) void onDeleteRun(runId)
            }}
          >
            Apagar
          </GameButton>
        </DialogSection>
      </GameDialog>
    </>
  )
}
