import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react'
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
import { columnsAt } from '@/features/gameplay/gameplayLayout'
import { objectiveCells } from '@/features/gameplay/gameplayLogic'
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
import { createSignalBus } from '@/features/tutorial/signalBus'
import type { SideTab, TutorialSignal } from '@/features/tutorial/tutorialTypes'
import { tabSignals } from '@/features/gameplay/tutorialSignals'
import { DemoDialog } from '@/features/demo/DemoDialog'
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
  const { decorative, reduced } = useMotionPrefs()
  const session = useGameplaySession(mission)
  const { snapshot, controller } = session
  useGameAudio(snapshot)
  const launchFlight = useFlightStore((store) => store.launch)
  const [showBriefing, setShowBriefing] = useState(!mission.tutorial)
  const [showDemo, setShowDemo] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [stepMode, setStepMode] = useState(false)
  const [sideTab, setSideTab] = useState('console')
  const [pane, setPane] = useState('program')
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

  const tutorialBus = useMemo(() => createSignalBus<TutorialSignal>(), [])
  const emitTutorial = useCallback(
    (signal: TutorialSignal) => {
      if (mission.tutorial) tutorialBus.emit(signal)
    },
    [mission.tutorial, tutorialBus],
  )
  const stackSize = session.program?.main.length ?? 0
  useEffect(() => {
    emitTutorial({ type: 'stackSize', size: stackSize })
  }, [stackSize, emitTutorial])
  const stepOnce = useCallback(() => {
    session.step()
    emitTutorial({ type: 'stepped' })
  }, [session, emitTutorial])
  const openSideTab = useCallback(
    (tab: string) => {
      setSideTab(tab)
      for (const signal of tabSignals(tab as SideTab, session.canReveal)) emitTutorial(signal)
    },
    [session.canReveal, emitTutorial],
  )

  useGameplayShortcuts({
    run: () => (stepMode ? stepOnce() : session.run()),
    toggle: () => (snapshot.status === 'running' ? controller.pause() : snapshot.status === 'paused' ? controller.resume() : session.run()),
    step: stepOnce,
    stop: () => controller.stop(),
  })

  const locked = snapshot.status === 'running' || snapshot.status === 'paused'
  const layoutProgress = useMotionValue(locked ? 1 : 0)
  const layoutColumns = useTransform(layoutProgress, columnsAt)

  useEffect(() => {
    const target = locked ? 1 : 0
    if (reduced) {
      layoutProgress.set(target)
      return
    }
    const controls = animate(layoutProgress, target, { duration: DURATIONS.layoutShift, ease: EASINGS.easeInOutSine })
    return () => controls.stop()
  }, [locked, reduced, layoutProgress])

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
      <motion.main
        className="gameplay__body"
        data-running={locked}
        style={{ gridTemplateColumns: layoutColumns }}
      >
        <section className="gameplay__editor" data-tutorial="editor" aria-label="Programa" id={panelId('pane', 'program')} aria-labelledby={tabId('pane', 'program')}>
          <BlocklyEditor
            toolbox={session.toolbox}
            initialJson={session.initialJson}
            readOnly={locked}
            highlightBlockId={snapshot.currentBlockId}
            errorBlock={session.errorBlock}
            looseBlockIds={session.serialized?.looseBlockIds ?? []}
            onChange={session.onWorkspaceChange}
            onLoadFailed={() => controller.addLog('warning', 'Não foi possível abrir o programa salvo desta fase. O editor foi reiniciado.')}
            onBlockEvent={(kind) => emitTutorial({ type: kind === 'added' ? 'blockAdded' : 'blockRemoved' })}
          />
        </section>
        <section className="gameplay__farm" data-tutorial="farm" id={panelId('pane', 'farm')} aria-labelledby={tabId('pane', 'farm')}>
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
            {succeeded && !mission.tutorial && (
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
              </motion.div>
            )}
          </AnimatePresence>
          {succeeded && <Confetti seed={`${mission.id}-play`} pieces={40} />}
        </section>
        <aside className="gameplay__side" id={panelId('pane', 'run')} aria-labelledby={tabId('pane', 'run')}>
          <ExecutionPanel
            status={snapshot.status}
            speed={snapshot.speed}
            stepMode={stepMode}
            onRun={session.run}
            onStep={stepOnce}
            onStop={() => controller.stop()}
            onSpeedChange={(speed) => controller.setSpeed(speed)}
            onStepModeChange={(value) => {
              setStepMode(value)
              if (value) emitTutorial({ type: 'stepModeOn' })
            }}
          />
          <div className="gameplay__side-tabs" data-tutorial="side">
            <PillTabs items={SIDE_TABS} active={sideTab} onChange={openSideTab} label="Informações da execução" idPrefix="side" variant="underline" />
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
                  onReveal={() => {
                    session.revealHint()
                    emitTutorial({ type: 'hintRevealed' })
                  }}
                />
              )}
              {sideTab === 'pseudocode' && <PseudocodePanel text={session.pseudocode} valid={session.program !== null} />}
            </motion.div>
          </div>
        </aside>
      </motion.main>
      <HarvestFlights />
      {mission.tutorial && (
        <TutorialOverlay
          snapshot={snapshot}
          bus={tutorialBus}
          facts={{ stackSize, stepMode }}
          onSideTab={(tab) => setSideTab(tab)}
          onExit={() => navigate('/missoes')}
        />
      )}
      <BriefingDialog
        open={showBriefing}
        mission={mission}
        onStart={() => setShowBriefing(false)}
        onDemo={() => {
          setShowBriefing(false)
          setShowDemo(true)
        }}
      />
      <DemoDialog
        open={showDemo}
        mission={mission}
        onBack={() => {
          setShowDemo(false)
          setShowBriefing(true)
        }}
        onStart={() => setShowDemo(false)}
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
