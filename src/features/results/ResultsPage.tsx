import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Icon } from '@/components/icons/Icon'
import { getMission } from '@/data/missions'
import { CONCEPT_TIPS, latestSuccess, nextStep, previousBestBefore, referenceStats } from '@/features/results/resultsLogic'
import { CONCEPT_LABELS } from '@/game/missions/missionTypes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { hasWebGL } from '@/render/hasWebGL'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import './ResultsPage.css'

const CelebrationScene = lazy(() => import('@/features/results/CelebrationScene'))

function Stars({ value }: { value: number }) {
  return (
    <span className="stars" role="img" aria-label={`Eficiência ${value} de 3`}>
      {[1, 2, 3].map((position) => (
        <span key={position} className={position <= value ? 'stars__on' : 'stars__off'} aria-hidden="true">
          <Icon name="star" size={20} />
        </span>
      ))}
    </span>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="result-stat" role="group" aria-label={label}>
      <span className="result-stat__label" aria-hidden="true">
        {label}
      </span>
      <span className="result-stat__value">{children}</span>
    </div>
  )
}

export function ResultsPage() {
  const { missionId = '' } = useParams()
  const mission = getMission(missionId)
  const save = useProgressStore((store) => store.save)
  const renderMode = useSettingsStore((store) => store.settings.renderMode)
  const reducedMotion = useReducedMotion()
  const webgl = useMemo(() => hasWebGL(), [])
  const [showSolution, setShowSolution] = useState(false)
  const attempt = mission ? latestSuccess(save, mission.id) : null
  const reference = useMemo(() => (mission ? referenceStats(mission) : null), [mission])

  if (!mission) return <Navigate to="/missoes" replace />
  if (!attempt || !reference) return <Navigate to={`/jogar/${mission.id}`} replace />

  const previous = previousBestBefore(save, attempt)
  const progress = save.missions[mission.id]
  const next = nextStep(mission, save)
  const show3d = renderMode !== '2d' && webgl

  return (
    <div className="results">
      <div className="results__scene" aria-hidden="true">
        {show3d ? (
          <Suspense fallback={null}>
            <CelebrationScene reducedMotion={reducedMotion} />
          </Suspense>
        ) : (
          <div className="home-scene--fallback" />
        )}
        {!reducedMotion && <div className="results__confetti" />}
      </div>

      <main className="results__content">
        <section className="results__card card" aria-labelledby="results-title">
          <div className="results__head">
            <span className="results__star" aria-hidden="true">
              <Icon name="star" size={48} />
            </span>
            <div>
              <h1 id="results-title" className="results__title">
                Missão concluída!
              </h1>
              <p className="results__goal">{mission.briefing.goalText}</p>
            </div>
          </div>

          <div className="results__verdict">
            <span className="results__correct">
              <Icon name="check" /> Solução correta
            </span>
            <Stars value={attempt.efficiencyStars ?? 1} />
          </div>
          <p className="results__note">A eficiência é avaliada à parte: uma solução correta nunca é reprovada por usar mais comandos.</p>

          <div className="results__stats">
            <Stat label="Comandos executados">{attempt.actions}</Stat>
            <Stat label="Tentativas">{progress?.attempts ?? attempt.attemptNumber}</Stat>
            <Stat label="Blocos usados">{attempt.blocks}</Stat>
            <Stat label="Dicas usadas">{attempt.hintsUsed}</Stat>
            <Stat label="Recursos consumidos">
              <span className="results__resources">
                <span>
                  <Icon name="seed" size={16} /> {attempt.usage.seeds}
                </span>
                <span>
                  <Icon name="drop" size={16} /> {attempt.usage.water}
                </span>
                <span>
                  <Icon name="bolt" size={16} /> {attempt.usage.energy}
                </span>
              </span>
            </Stat>
            <div className="results__concept">
              <Icon name="check" />
              <span>
                Conceito aprendido
                <strong>{CONCEPT_LABELS[mission.concept]}</strong>
              </span>
            </div>
          </div>

          {previous && (
            <p className="results__compare">
              Comparado com sua melhor solução anterior: {previous.actions} → {attempt.actions} comandos, {previous.blocks} → {attempt.blocks} blocos.
            </p>
          )}

          <div className="results__actions">
            <button type="button" className="button" aria-expanded={showSolution} onClick={() => setShowSolution((value) => !value)}>
              <Icon name="book" /> {showSolution ? 'Ocultar explicação' : 'Ver solução'}
            </button>
            <Link to={`/jogar/${mission.id}`} className="button">
              <Icon name="reset" /> Tentar melhorar
            </Link>
            <Link to={next.to} className="button button--primary">
              {next.label}
            </Link>
          </div>
        </section>

        {showSolution && (
          <section className="results__explain card" aria-labelledby="explain-title">
            <h2 id="explain-title">Como funciona?</h2>
            <p>{mission.solutionExplanation}</p>
            <div className="results__columns">
              <figure>
                <figcaption>O seu algoritmo</figcaption>
                <pre>{attempt.pseudocode}</pre>
              </figure>
              <figure>
                <figcaption>Uma solução de referência (existem outras corretas)</figcaption>
                <pre>{reference.pseudocode}</pre>
              </figure>
            </div>
            <table className="results__table">
              <caption>Comparação entre soluções corretas</caption>
              <thead>
                <tr>
                  <th scope="col">Medida</th>
                  <th scope="col">Sua solução</th>
                  <th scope="col">Referência</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Comandos executados</th>
                  <td>{attempt.actions}</td>
                  <td>{reference.actions}</td>
                </tr>
                <tr>
                  <th scope="row">Blocos usados</th>
                  <td>{attempt.blocks}</td>
                  <td>{reference.blocks}</td>
                </tr>
              </tbody>
            </table>
            <aside className="results__tip">
              <Icon name="bulb" />
              <div>
                <strong>Dica</strong>
                <p>{CONCEPT_TIPS[mission.concept]}</p>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  )
}
