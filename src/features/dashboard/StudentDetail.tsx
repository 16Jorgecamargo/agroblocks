import { useEffect, useId, useRef, useState } from 'react'
import { itemsFor } from '@/data/assessment/items'
import { MISSIONS } from '@/data/missions'
import { WORLDS } from '@/data/worlds'
import { describePlot, formatDate, PlotCell } from '@/features/dashboard/ClassField'
import { scoreAssessment, tutorialLabel, type Plot, type StudentRow } from '@/features/dashboard/dashboardModel'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { ERROR_TEXT } from '@/game/rules/errors'
import type { WorldId } from '@/game/worlds/worldTypes'
import type { RunSnapshot } from '@/shared/runSnapshot'

interface StudentDetailProps {
  student: StudentRow | null
  demo: boolean
  onClose: () => void
  onDeleteRun: (runId: string) => Promise<void>
}

const STATUS = { completed: 'Concluída', available: 'Liberada, ainda não concluída', locked: 'Ainda bloqueada' } as const
const OUTCOME = { success: 'Deu certo', objectiveFailed: 'Objetivo não cumprido', error: 'Parou com erro' } as const
const ordered = [...MISSIONS].sort((a, b) => a.order - b.order)
const titleOf = (missionId: string) => MISSIONS.find((mission) => mission.id === missionId)?.title ?? missionId

function runPlot(run: RunSnapshot, missionId: string): Plot {
  const progress = run.missions[missionId]
  const attempts = run.attempts.filter((attempt) => attempt.missionId === missionId).length
  const state = progress?.status === 'completed' ? 'done' : attempts > 0 ? 'trying' : 'empty'
  return { state, attempts, stars: progress?.bestResult?.efficiencyStars ?? 0, hints: progress?.hintsUsed ?? 0 }
}

const errorText = (code: string) => ERROR_TEXT[code as keyof typeof ERROR_TEXT]?.message ?? code

function MissionFacts({ run, missionId }: { run: RunSnapshot; missionId: string }) {
  const progress = run.missions[missionId]
  const best = progress?.bestResult ?? null
  const counts = new Map<string, number>()
  for (const attempt of run.attempts) if (attempt.missionId === missionId && attempt.errorCode) counts.set(attempt.errorCode, (counts.get(attempt.errorCode) ?? 0) + 1)
  const errors = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return (
    <div className="mission-facts" role="region" aria-label={`Detalhes de ${titleOf(missionId)}`}>
      <h4 className="mission-facts__title">{titleOf(missionId)}</h4>
      <dl className="mission-facts__grid">
        <div>
          <dt>Situação</dt>
          <dd>{progress ? STATUS[progress.status] : 'Ainda bloqueada'}</dd>
        </div>
        <div>
          <dt>Tentativas</dt>
          <dd>{progress?.attempts ?? 0}</dd>
        </div>
        <div>
          <dt>Dicas usadas</dt>
          <dd>{progress?.hintsUsed ?? 0} de 4</dd>
        </div>
        <div>
          <dt>Estrelas</dt>
          <dd>{best ? `${'★'.repeat(best.efficiencyStars)} (${best.efficiencyStars} de 3)` : '—'}</dd>
        </div>
        <div>
          <dt>Melhor solução</dt>
          <dd>{best ? `${best.actions} comandos, ${best.blocks} blocos` : '—'}</dd>
        </div>
        <div>
          <dt>Recursos na melhor solução</dt>
          <dd>{best ? `${best.usage.seeds} sementes, ${best.usage.water} de água, ${best.usage.energy} de energia` : '—'}</dd>
        </div>
      </dl>
      {errors.length > 0 && (
        <>
          <h5 className="mission-facts__sub">Erros nesta fase</h5>
          <ul className="mission-facts__errors">
            {errors.map(([code, count]) => (
              <li key={code}>
                <span>{errorText(code)}</span> <strong>{count}×</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function worldTouched(run: RunSnapshot, world: WorldId): boolean {
  if (run.assessments[world]?.pre) return true
  return MISSIONS.some((mission) => mission.world === world && (run.missions[mission.id]?.status === 'completed' || run.attempts.some((attempt) => attempt.missionId === mission.id)))
}

function PlotButton({
  mission,
  plot,
  index,
  selected,
  label,
  onToggle,
}: {
  mission: MissionDefinition
  plot: Plot
  index: number
  selected: boolean
  label: string
  onToggle: (id: string) => void
}) {
  return (
    <li>
      <button type="button" className="run__plot" aria-pressed={selected} title={describePlot(mission.title, plot)} onClick={() => onToggle(mission.id)}>
        <PlotCell plot={plot} title={mission.title} order={index} />
        <span className="run__plot-label" aria-hidden="true">
          {label}
        </span>
      </button>
    </li>
  )
}

function Answers({ response, label }: { response: RunSnapshot['assessments']['garden']['pre']; label: string }) {
  if (!response) return <p className="run__note">{label}: não feita.</p>
  if (response.skipped) return <p className="run__note">{label}: pulada.</p>
  return (
    <details className="run__answers">
      <summary>
        {label}: {scoreAssessment(response)} de 10
      </summary>
      <ol>
        {itemsFor(response.world, response.form).map((item) => {
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
  const [missionId, setMissionId] = useState<string | null>(null)
  const toggleMission = (id: string) => setMissionId((current) => (current === id ? null : id))
  const attempts = missionId ? run.attempts.filter((attempt) => attempt.missionId === missionId) : run.attempts
  return (
    <section className="run">
      <header className="run__head">
        <h3>Jogada de {formatDate(run.createdAt)}</h3>
        <p className="run__note">
          Tutorial: {tutorialLabel(run.tutorial)}
          {run.tutorial && ` (${formatDate(run.tutorial.at)})`}
        </p>
      </header>
      <p className="run__note">Escolha uma missão para ver os detalhes dela.</p>
      {ordered
        .filter((mission) => mission.world === null)
        .map((mission, index) => (
          <ul key={mission.id} className="run__plots" aria-label="Treinamento">
            <PlotButton mission={mission} plot={runPlot(run, mission.id)} index={index} selected={missionId === mission.id} label="Treino" onToggle={toggleMission} />
          </ul>
        ))}
      {WORLDS.filter((world) => worldTouched(run, world.id)).map((world) => {
        const worldMissions = ordered.filter((mission) => mission.world === world.id)
        const completed = worldMissions.filter((mission) => run.missions[mission.id]?.status === 'completed').length
        return (
          <section key={world.id} className="run__world">
            <h4>{`${world.name} · ${completed} de ${worldMissions.length}`}</h4>
            <ul className="run__plots" aria-label={`Missões de ${world.name}`}>
              {worldMissions.map((mission, index) => (
                <PlotButton
                  key={mission.id}
                  mission={mission}
                  plot={runPlot(run, mission.id)}
                  index={index}
                  selected={missionId === mission.id}
                  label={String(mission.slot)}
                  onToggle={toggleMission}
                />
              ))}
            </ul>
            <Answers response={run.assessments[world.id]?.pre ?? null} label="Prova inicial" />
            <Answers response={run.assessments[world.id]?.post ?? null} label="Prova final" />
          </section>
        )
      })}
      {missionId && <MissionFacts run={run} missionId={missionId} />}
      <div className="run__attempts-head">
        <h4>{missionId ? `Tentativas em ${titleOf(missionId)}` : 'Todas as tentativas'}</h4>
        {missionId && (
          <button type="button" className="dash-button dash-button--quiet" onClick={() => setMissionId(null)}>
            Ver todas as fases
          </button>
        )}
      </div>
      {attempts.length === 0 ? (
        <p className="run__note">Nenhuma tentativa ainda.</p>
      ) : (
        <ol className="attempts">
          {attempts.map((attempt) => (
            <li key={attempt.id} className={`attempt attempt--${attempt.outcome}`}>
              <span className="attempt__when">{formatDate(attempt.timestamp)}</span>
              <span className="attempt__what">
                <strong>{titleOf(attempt.missionId)}</strong>
                <span className="attempt__outcome">{OUTCOME[attempt.outcome]}</span>
                {attempt.errorCode && <span className="attempt__error">{errorText(attempt.errorCode)}</span>}
              </span>
              <details className="attempt__code">
                <summary>Pseudocódigo</summary>
                <pre>{attempt.pseudocode || '(vazio)'}</pre>
              </details>
            </li>
          ))}
        </ol>
      )}
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
