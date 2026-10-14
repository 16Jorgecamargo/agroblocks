import { act, renderHook } from '@testing-library/react'
import { useExecutionController } from '@/features/gameplay/useExecutionController'
import { ManualScheduler } from '@/game/execution/manualScheduler'
import { act as action, program } from '@/blocks/interpreter/programBuilder'
import { makeState } from '@/game/testing/makeState'
import type { ControllerMission } from '@/game/execution/types'

const mission: ControllerMission = {
  initialState: makeState(['. .']),
  rules: { growTicks: 3, forbidWaterWet: false },
  goals: { objectives: [{ kind: 'robotAt', x: 1, y: 0 }] },
  stepLimit: 100,
}

describe('useExecutionController', () => {
  it('re-renders with new snapshots', () => {
    const scheduler = new ManualScheduler()
    const { result } = renderHook(() => useExecutionController(mission, { scheduler }))
    expect(result.current.snapshot.status).toBe('idle')
    act(() => result.current.controller.run(program([action('moveForward')])))
    act(() => scheduler.runAll())
    expect(result.current.snapshot.status).toBe('finished')
    expect(result.current.snapshot.validation?.success).toBe(true)
  })

  it('keeps the same controller across renders for the same mission', () => {
    const { result, rerender } = renderHook(() => useExecutionController(mission))
    const first = result.current.controller
    rerender()
    expect(result.current.controller).toBe(first)
  })
})
