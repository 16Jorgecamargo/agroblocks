import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { ExecutionController } from '@/game/execution/controller'
import type { Scheduler } from '@/game/execution/scheduler'
import type { ControllerMission, ExecutionSnapshot, Speed } from '@/game/execution/types'

export function useExecutionController(
  mission: ControllerMission,
  options: { scheduler?: Scheduler; speed?: Speed } = {},
): { controller: ExecutionController; snapshot: ExecutionSnapshot } {
  const { scheduler, speed } = options
  const controller = useMemo(() => new ExecutionController(mission, scheduler, speed), [mission, scheduler])
  useEffect(() => () => controller.dispose(), [controller])
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  return { controller, snapshot }
}
