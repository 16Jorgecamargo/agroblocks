import { act, fireEvent, render, screen } from '@testing-library/react'
import { getMission } from '@/data/missions'
import { DemoDialog } from '@/features/demo/DemoDialog'
import { DEMO_TIMING, demoFrames } from '@/features/demo/demoFrames'

function mission() {
  const found = getMission('m1-first-harvest')
  if (!found) throw new Error('missing')
  return found
}

describe('DemoDialog', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('plays the robot on the farm in a loop without showing any code blocks', () => {
    render(<DemoDialog open mission={mission()} onBack={vi.fn()} onStart={vi.fn()} />)
    const stage = screen.getByRole('img', { name: 'Demonstração: o robô na fazenda' })
    expect(stage).toHaveAttribute('data-frame', '0')
    act(() => {
      vi.advanceTimersByTime(DEMO_TIMING.startHoldMs)
    })
    expect(stage).toHaveAttribute('data-frame', '1')
    const frames = demoFrames(mission())
    const delays = [...Array.from({ length: frames.length - 2 }, () => DEMO_TIMING.stepMs), DEMO_TIMING.endHoldMs]
    for (const delay of delays) {
      act(() => {
        vi.advanceTimersByTime(delay)
      })
    }
    expect(stage).toHaveAttribute('data-frame', '0')
    expect(stage).toHaveAttribute('data-cycle', '1')
    expect(screen.queryByText(/mover para frente|virar à/i)).not.toBeInTheDocument()
  })

  it('goes back to the briefing or starts the mission', () => {
    const onBack = vi.fn()
    const onStart = vi.fn()
    render(<DemoDialog open mission={mission()} onBack={onBack} onStart={onStart} />)
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
