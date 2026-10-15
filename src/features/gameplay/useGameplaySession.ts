import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { detectRepetition, REPETITION_TIP } from '@/blocks/analysis/detectRepetition'
import type { Program } from '@/blocks/interpreter/ast'
import { programToPseudocode } from '@/blocks/pseudocode/pseudocode'
import { serializeWorkspace, type SerializeResult } from '@/blocks/serializer/serializeWorkspace'
import type { WorkspaceJson } from '@/blocks/serializer/workspaceJson'
import { buildToolbox } from '@/blocks/toolbox/buildToolbox'
import { buildAttemptInput, canRevealHint, loadInitialWorkspace } from '@/features/gameplay/gameplayLogic'
import { useExecutionController } from '@/features/gameplay/useExecutionController'
import type { MissionDefinition } from '@/game/missions/missionTypes'
import { toControllerMission } from '@/game/missions/toControllerMission'
import { failedAttempts } from '@/game/progress/progression'
import type { AttemptRecord } from '@/game/progress/types'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'

const SAVE_DELAY_MS = 400

export function useGameplaySession(mission: MissionDefinition) {
  const controllerMission = useMemo(() => toControllerMission(mission), [mission])
  const defaultSpeed = useSettingsStore((store) => store.settings.defaultSpeed)
  const { controller, snapshot } = useExecutionController(controllerMission, {
    speed: mission.tutorial ? 0.5 : defaultSpeed,
  })
  const save = useProgressStore((store) => store.save)
  const storeProgram = useProgressStore((store) => store.storeProgram)
  const recordAttempt = useProgressStore((store) => store.recordAttempt)
  const registerHint = useProgressStore((store) => store.registerHint)

  const [initialJson] = useState<WorkspaceJson | null>(() =>
    loadInitialWorkspace(useProgressStore.getState().save.missions[mission.id]?.savedProgram ?? null, mission),
  )
  const toolbox = useMemo(() => buildToolbox(mission.allowedBlocks), [mission])
  const [serialized, setSerialized] = useState<SerializeResult | null>(null)
  const [validationError, setValidationError] = useState<{ id: string; message: string } | null>(null)
  const [lastAttempt, setLastAttempt] = useState<AttemptRecord | null>(null)
  const saveTimer = useRef<number | null>(null)
  const repetitionTipShown = useRef(false)
  const recordedRunId = useRef<number | null>(null)
  const demoRunId = useRef<number | null>(null)
  const runMeta = useRef<{ runId: number; blockCount: number; pseudocode: string } | null>(null)

  const onWorkspaceChange = useCallback(
    (json: WorkspaceJson) => {
      setSerialized(serializeWorkspace(json))
      setValidationError(null)
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => storeProgram(mission.id, JSON.stringify(json)), SAVE_DELAY_MS)
    },
    [mission.id, storeProgram],
  )

  useEffect(
    () => () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current)
    },
    [],
  )

  const program: Program | null = serialized?.ok ? serialized.program : null
  const pseudocode = useMemo(() => (program ? programToPseudocode(program) : ''), [program])

  useEffect(() => {
    if (!program || mission.order < 2 || repetitionTipShown.current) return
    if (detectRepetition(program)) {
      repetitionTipShown.current = true
      controller.addLog('info', REPETITION_TIP)
    }
  }, [program, mission.order, controller])

  const readyProgram = useCallback((): Program | null => {
    if (!serialized) return null
    if (serialized.ok) return serialized.program
    for (const error of serialized.errors) controller.addLog('error', error.message)
    const located = serialized.errors.find((error) => error.blockId !== null)
    setValidationError(located?.blockId ? { id: located.blockId, message: located.message } : null)
    return null
  }, [serialized, controller])

  const logWarnings = useCallback(() => {
    if (!serialized?.ok) return
    for (const warning of serialized.warnings) controller.addLog('warning', warning.message)
  }, [serialized, controller])

  const leaveDemo = useCallback(() => {
    const current = controller.getSnapshot()
    const demoActive = demoRunId.current === current.runId && (current.status === 'running' || current.status === 'paused')
    if (demoActive) controller.reset()
  }, [controller])

  const rememberRun = useCallback(() => {
    const runId = controller.getSnapshot().runId
    if (runMeta.current?.runId === runId) return
    runMeta.current = { runId, blockCount: serialized?.ok ? serialized.blockCount : 0, pseudocode }
  }, [controller, serialized, pseudocode])

  const run = useCallback(() => {
    const ready = readyProgram()
    if (!ready) return
    leaveDemo()
    controller.run(ready)
    rememberRun()
    logWarnings()
  }, [readyProgram, controller, logWarnings, leaveDemo, rememberRun])

  const step = useCallback(() => {
    const ready = readyProgram()
    if (!ready) return
    leaveDemo()
    controller.step(ready)
    rememberRun()
  }, [readyProgram, controller, leaveDemo, rememberRun])

  const runDemo = useCallback(() => {
    const demo = mission.briefing.demo
    if (!demo) return
    controller.reset()
    controller.addLog('info', 'Demonstração: observe o que o robô faz. Depois clique em Parar e monte o seu programa.')
    controller.run(demo)
    demoRunId.current = controller.getSnapshot().runId
  }, [mission, controller])

  useEffect(() => {
    const ended = snapshot.status === 'finished' || snapshot.status === 'failed'
    if (!ended || recordedRunId.current === snapshot.runId || demoRunId.current === snapshot.runId) return
    recordedRunId.current = snapshot.runId
    const meta = runMeta.current?.runId === snapshot.runId ? runMeta.current : null
    const blockCount = meta ? meta.blockCount : serialized?.ok ? serialized.blockCount : 0
    const ranPseudocode = meta ? meta.pseudocode : pseudocode
    const input = buildAttemptInput(snapshot, mission, blockCount, ranPseudocode, new Date().toISOString())
    setLastAttempt(recordAttempt(input))
  }, [snapshot, mission, serialized, pseudocode, recordAttempt])

  const progress = save.missions[mission.id]
  const hintsRevealed = progress?.hintsUsed ?? 0
  const failed = failedAttempts(save, mission.id)
  const canReveal = canRevealHint(hintsRevealed, failed)
  const revealHint = useCallback(() => {
    if (canReveal) registerHint(mission.id)
  }, [canReveal, registerHint, mission.id])

  const errorBlock =
    snapshot.status === 'failed' && snapshot.error && snapshot.errorBlockId
      ? { id: snapshot.errorBlockId, message: `${snapshot.error.message} ${snapshot.error.hint}` }
      : validationError

  return {
    snapshot,
    controller,
    toolbox,
    initialJson,
    serialized,
    program,
    pseudocode,
    errorBlock,
    onWorkspaceChange,
    run,
    step,
    runDemo,
    hintsRevealed,
    canReveal,
    failed,
    revealHint,
    lastAttempt,
  }
}
