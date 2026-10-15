import { lazy, Suspense, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Confetti } from '@/components/game/Confetti'
import { CountUp } from '@/components/game/CountUp'
import { GameButton, GameLink } from '@/components/game/GameButton'
import { StarRow } from '@/components/game/StarRow'
import { Icon } from '@/components/icons/Icon'
import { getMission } from '@/data/missions'
import { HowItWorks } from '@/features/results/HowItWorks'
import { latestSuccess, nextStep, previousBestBefore, referenceStats } from '@/features/results/resultsLogic'
import { CONCEPT_LABELS } from '@/game/missions/missionTypes'
import { SPRINGS } from '@/motion/springs'
import { overshoot, softRise, staggerContainer, staggerItem } from '@/motion/presets'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { hasWebGL } from '@/render/hasWebGL'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import './ResultsPage.css'

const CelebrationScene = lazy(() => import('@/features/results/CelebrationScene'))

export function ResultsPage() {
  const { missionId = '' } = useParams()
  const mission = getMission(missionId)
  const save = useProgressStore((store) => store.save)
  const renderMode = useSettingsStore((store) => store.settings.renderMode)
  const { reduced } = useMotionPrefs()
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
            <CelebrationScene reducedMotion={reduced} />
          </Suspense>
        ) : (
          <div className="home-scene--fallback" />
        )}
      </div>
      {!reduced && <Confetti seed={mission.id} />}

      <main className="results__content">
        <motion.section className="results__card" aria-labelledby="results-title" variants={overshoot} initial="hidden" animate="visible">
          <div className="results__head">
            <motion.span
              className="results__star"
              aria-hidden="true"
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...SPRINGS.star, delay: 0.15 }}
            >
              <Icon name="star" size={56} />
            </motion.span>
            <div>
              <h1 id="results-title" className="results__title">
                Missão concluída!
              </h1>
              <p className="results__goal">{mission.briefing.goalText}</p>
            </div>
          </div>

          <motion.div className="results__boxes" variants={staggerContainer(0.1, 0.25)} initial="hidden" animate="visible">
            <motion.div className="results__box" variants={staggerItem}>
              <div className="result-stat" role="group" aria-label="Comandos executados">
                <span className="result-stat__label" aria-hidden="true">
                  Comandos executados
                </span>
                <span className="result-stat__value">
                  <CountUp value={attempt.actions} />
                </span>
              </div>
              <div className="result-stat" role="group" aria-label="Recursos consumidos">
                <span className="result-stat__label" aria-hidden="true">
                  Recursos consumidos
                </span>
                <span className="results__resources">
                  <span>
                    <Icon name="seed" size={18} /> {attempt.usage.seeds}
                  </span>
                  <span>
                    <Icon name="drop" size={18} /> {attempt.usage.water}
                  </span>
                  <span>
                    <Icon name="bolt" size={18} /> {attempt.usage.energy}
                  </span>
                </span>
              </div>
            </motion.div>
            <motion.div className="results__box" variants={staggerItem}>
              <div className="result-stat" role="group" aria-label="Tentativas">
                <span className="result-stat__label" aria-hidden="true">
                  Tentativas
                </span>
                <span className="result-stat__value">
                  <CountUp value={progress?.attempts ?? attempt.attemptNumber} />
                </span>
              </div>
              <div className="results__concept">
                <span className="results__concept-badge" aria-hidden="true">
                  <Icon name="check" size={18} />
                </span>
                <span>
                  Conceito aprendido
                  <strong>{CONCEPT_LABELS[mission.concept]}</strong>
                </span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div className="results__meta" variants={softRise} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
            <span className="results__efficiency">
              Eficiência <StarRow value={attempt.efficiencyStars ?? 1} label={`Eficiência ${attempt.efficiencyStars ?? 1} de 3`} delay={0.6} />
            </span>
            <span>Blocos usados: {attempt.blocks}</span>
            <span>Dicas usadas: {attempt.hintsUsed}</span>
            <span className="results__correct">
              <Icon name="check" size={16} /> Solução correta
            </span>
          </motion.div>
          <p className="results__note">A eficiência é avaliada à parte: uma solução correta nunca é reprovada por usar mais comandos.</p>
          {previous && (
            <p className="results__compare">
              Comparado com sua melhor solução anterior: {previous.actions} → {attempt.actions} comandos, {previous.blocks} → {attempt.blocks} blocos.
            </p>
          )}
        </motion.section>

        <motion.div className="results__actions" variants={staggerContainer(0.08, 0.6)} initial="hidden" animate="visible">
          <motion.div variants={staggerItem}>
            <GameButton tone="dark" size="lg" icon="book" aria-expanded={showSolution} onClick={() => setShowSolution((value) => !value)}>
              {showSolution ? 'Ocultar solução' : 'Ver solução'}
            </GameButton>
          </motion.div>
          <motion.div variants={staggerItem}>
            <GameLink to={`/jogar/${mission.id}`} tone="dark" size="lg" icon="reset">
              Tentar novamente
            </GameLink>
          </motion.div>
          <motion.div variants={staggerItem} className="results__next">
            <GameLink to={next.to} tone="primary" size="lg">
              {next.label}
            </GameLink>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {showSolution && (
            <HowItWorks
              key="how"
              mission={mission}
              savedProgram={progress?.savedProgram ?? null}
              pseudocode={attempt.pseudocode}
              reference={reference}
              attempt={{ actions: attempt.actions, blocks: attempt.blocks }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
