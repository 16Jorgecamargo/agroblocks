import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { BlocklyEditor } from '@/blocks/editor/BlocklyEditor'
import { Confetti } from '@/components/game/Confetti'
import { PillTabs, panelId, tabId, type TabItem } from '@/components/game/PillTabs'
import { getMission } from '@/data/missions'
import { BriefingDialog } from '@/features/gameplay/components/BriefingDialog'
import { ConsolePanel } from '@/features/gameplay/components/ConsolePanel'
import { ExecutionPanel } from '@/features/gameplay/components/ExecutionPanel'
import { GameHud } from '@/features/gameplay/components/GameHud'
import { HarvestFlights } from '@/features/gameplay/components/HarvestFlights'
import { HintsPanel } from '@/features/gameplay/components/HintsPanel'
import { PseudocodePanel } from '@/features/gameplay/components/PseudocodePanel'
import { currentStepLabel, objectiveCells } from '@/features/gameplay/gameplayLogic'
import { useGameplaySession } from '@/features/gameplay/useGameplaySession'
import { useGameplayShortcuts } from '@/features/gameplay/useGameplayShortcuts'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { TutorialOverlay } from '@/features/tutorial/TutorialOverlay'
import { stepDelayMs } from '@/game/execution/types'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { EASINGS } from '@/motion/easings'
import { DURATIONS } from '@/motion/presets'
import { SPRINGS } from '@/motion/springs'
import { useMotionPrefs } from '@/motion/useMotionPrefs'
import { locateCell } from '@/render/cellLocator'
import { FarmView } from '@/render/FarmView'
import { useGameAudio } from '@/services/audio/useGameAudio'
import { useFlightStore } from '@/stores/flightStore'
import { useProgressStore } from '@/stores/progressStore'
import './GameplayPage.css'

const SIDE_TABS: TabItem[] = [
  { id: 'console', label: 'Console' },
  { id: 'hints', label: 'Dicas' },
  { id: 'pseudocode', label: 'Pseudocódigo' },
]

const PANE_TABS: TabItem[] = [
  { id: 'program', label: 'Programa' },
  { id: 'farm', label: 'Fazenda' },
  { id: 'run', label: 'Execução' },
]

function harvestTargetCenter(): { x: number; y: number } | null {
  const target = document.querySelector('[data-flight-target="harvest"]')
  if (!target) return null
  const rect = target.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function GameplayScreen({ mission }: { mission: MissionDefinition }) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const { decorative } = useMotionPrefs()
  const session = useGameplaySession(mission)
  const { snapshot, controller } = session
  useGameAudio(snapshot)
  const launchFlight = useFlightStore((store) => store.launch)
  const [showBriefing, setShowBriefing] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [stepMode, setStepMode] = useState(false)
  const [sideTab, setSideTab] = useState('console')
  const [pane, setPane] = useState('program')
  const [blockEvent, setBlockEvent] = useState<{ kind: 'added' | 'removed'; id: number } | null>(null)
  const blockEventId = useRef(0)
  const highlightCells = useMemo(() => objectiveCells(mission), [mission])
  const succeeded = snapshot.status === 'finished' && snapshot.validation?.success === true

  useEffect(() => {
    if (!succeeded || mission.tutorial || !session.lastAttempt || session.lastAttempt.outcome !== 'success') return
    const timer = window.setTimeout(() => navigate(`/resultado/${mission.id}`), reducedMotion ? 600 : 2200)
    return () => window.clearTimeout(timer)
  }, [succeeded, mission, session.lastAttempt, navigate, reducedMotion])

  useEffect(() => {
    if (!decorative) return
    for (const event of snapshot.lastEvents) {
      if (event.type !== 'plotChanged' || event.to !== 'harvested') continue
      const from = locateCell(event.x, event.y)
      const to = harvestTargetCenter()
      if (from && to) launchFlight(from, to)
    }
  }, [snapshot.lastEvents, decorative, launchFlight])

  useGameplayShortcuts({
    run: () => (stepMode ? session.step() : session.run()),
    toggle: () => (snapshot.status === 'running' ? controller.pause() : snapshot.status === 'paused' ? controller.resume() : session.run()),
    step: () => session.step(),
    stop: () => controller.stop(),
  })

  const locked = snapshot.status === 'running' || snapshot.status === 'paused'

  return (
    <div className="gameplay" data-pane={pane}>
      <GameHud
        mission={mission}
        resources={snapshot.state.resources}
        onHelp={() => setShowBriefing(true)}
        onSettings={() => setShowSettings(true)}
        onExit={() => navigate('/missoes')}
      />
      <p className="gameplay__small-screen" role="note">
        A experiência completa de programação funciona melhor em telas a partir de 768 px (computador ou tablet).
      </p>
      <div className="gameplay__pane-tabs">
        <PillTabs items={PANE_TABS} active={pane} onChange={setPane} label="Áreas da tela" idPrefix="pane" />
      </div>
      <main className="gameplay__body">
        <section className="gameplay__editor" aria-label="Programa" id={panelId('pane', 'program')} aria-labelledby={tabId('pane', 'program')}>
          <BlocklyEditor
            toolbox={session.toolbox}
            initialJson={session.initialJson}
            readOnly={locked}
            highlightBlockId={snapshot.currentBlockId}
            errorBlock={session.errorBlock}
            looseBlockIds={session.serialized?.looseBlockIds ?? []}
            onChange={session.onWorkspaceChange}
            onLoadFailed={() => controller.addLog('warning', 'Não foi possível abrir o programa salvo desta fase. O editor foi reiniciado.')}
            onBlockEvent={(kind) => {
              blockEventId.current += 1
              setBlockEvent({ kind, id: blockEventId.current })
            }}
          />
        </section>
        <section className="gameplay__farm" id={panelId('pane', 'farm')} aria-labelledby={tabId('pane', 'farm')}>
          <FarmView
            state={snapshot.state}
            lastEvents={snapshot.lastEvents}
            eventKey={snapshot.stepCount}
            stepDurationMs={stepDelayMs(snapshot.speed)}
            highlightCells={highlightCells}
            failed={snapshot.status === 'failed'}
            seedKey={mission.id}
            growTicks={mission.growTicks}
            celebrating={succeeded}
          />
          <AnimatePresence>
            {succeeded && (
              <motion.div
                key="celebration"
                className="gameplay__celebration"
                role="status"
                initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRINGS.jelly}
              >
                <motion.span
                  className="gameplay__celebration-burst"
                  aria-hidden="true"
                  initial={{ scale: 0.5, opacity: 0.9 }}
                  animate={{ scale: 2.6, opacity: 0 }}
                  transition={{ duration: DURATIONS.burst, ease: EASINGS.easeOutCubic }}
                />
                <strong>Missão concluída!</strong>
                {mission.tutorial && <span> Você completou o treinamento.</span>}
              </motion.div>
            )}
          </AnimatePresence>
          {succeeded && <Confetti seed={`${mission.id}-play`} pieces={40} />}
          {mission.tutorial && <TutorialOverlay snapshot={snapshot} blockEvent={blockEvent} />}
        </section>
        <aside className="gameplay__side" id={panelId('pane', 'run')} aria-labelledby={tabId('pane', 'run')}>
          <ExecutionPanel
            status={snapshot.status}
            speed={snapshot.speed}
            stepMode={stepMode}
            actionCount={snapshot.state.actionCount}
            currentLabel={currentStepLabel(snapshot.lastStep)}
            onRun={session.run}
            onStep={session.step}
            onPause={() => controller.pause()}
            onResume={() => controller.resume()}
            onStop={() => controller.stop()}
            onReset={() => controller.reset()}
            onSpeedChange={(speed) => controller.setSpeed(speed)}
            onStepModeChange={setStepMode}
          />
          <div className="gameplay__side-tabs">
            <PillTabs items={SIDE_TABS} active={sideTab} onChange={setSideTab} label="Informações da execução" idPrefix="side" variant="underline" />
            <motion.div
              key={sideTab}
              role="tabpanel"
              id={panelId('side', sideTab)}
              aria-labelledby={tabId('side', sideTab)}
              className="gameplay__side-panel"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: DURATIONS.quickExit }}
            >
              {sideTab === 'console' && <ConsolePanel entries={snapshot.log} onClear={() => controller.clearLog()} />}
              {sideTab === 'hints' && (
                <HintsPanel
                  hints={mission.hints}
                  revealed={session.hintsRevealed}
                  canReveal={session.canReveal}
                  failedAttempts={session.failed}
                  onReveal={session.revealHint}
                />
              )}
              {sideTab === 'pseudocode' && <PseudocodePanel text={session.pseudocode} valid={session.program !== null} />}
            </motion.div>
          </div>
        </aside>
      </main>
      <HarvestFlights />
      <BriefingDialog
        open={showBriefing}
        mission={mission}
        onStart={() => setShowBriefing(false)}
        onDemo={() => {
          setShowBriefing(false)
          session.runDemo()
        }}
      />
      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export function GameplayPage() {
  const { missionId = '' } = useParams()
  const mission = getMission(missionId)
  const status = useProgressStore((store) => store.save.missions[missionId]?.status)
  if (!mission || !status || status === 'locked') return <Navigate to="/missoes" replace />
  return <GameplayScreen key={mission.id} mission={mission} />
}
