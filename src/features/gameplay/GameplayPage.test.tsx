import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { GameplayPage } from '@/features/gameplay/GameplayPage'
import { IDLE_COLUMNS, RUNNING_COLUMNS } from '@/features/gameplay/gameplayLayout'
import { useProgressStore } from '@/stores/progressStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/services/storage/settingsStorage'
import { useFlightStore } from '@/stores/flightStore'

vi.mock('@/blocks/editor/BlocklyEditor', async () => {
  const { useEffect } = await import('react')
  const { programToWorkspaceJson } = await import('@/blocks/serializer/programToWorkspaceJson')
  const { getMission } = await import('@/data/missions')
  return {
    BlocklyEditor: ({ onChange }: { onChange: (json: unknown) => void }) => {
      useEffect(() => {
        const mission = getMission('m1-first-harvest')
        if (mission) onChange(programToWorkspaceJson(mission.referenceSolution))
      }, [onChange])
      return (
        <button type="button" onClick={() => onChange(programToWorkspaceJson({ main: [], procedures: {} }))}>
          Trocar programa
        </button>
      )
    },
  }
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/jogar/:missionId" element={<GameplayPage />} />
        <Route path="/resultado/:missionId" element={<p>Tela de resultado</p>} />
        <Route path="/missoes" element={<p>Mapa de missões</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GameplayPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: '2d', motion: 'reduced' } })
    useProgressStore.getState().resetProgress()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('swaps the side panel at once when changing tabs, without an empty gap', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: '2d', motion: 'full' } })
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('tab', { name: 'Dicas' }))
    const panels = screen.getAllByRole('tabpanel', { hidden: true }).filter((panel) => panel.id.startsWith('side-panel'))
    expect(panels.map((panel) => panel.id)).toEqual(['side-panel-hints'])
  })

  it('widens the farm and narrows the program while running, then restores the layout', () => {
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    const body = document.querySelector('.gameplay__body') as HTMLElement
    expect(body).toHaveAttribute('data-running', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    expect(body).toHaveAttribute('data-running', 'true')
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(body.style.gridTemplateColumns).toBe(RUNNING_COLUMNS)
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }))
    expect(body).toHaveAttribute('data-running', 'false')
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(body.style.gridTemplateColumns).toBe(IDLE_COLUMNS)
  })

  it('redirects locked missions to the mission map', () => {
    renderAt('/jogar/m6-efficient-farm')
    expect(screen.getByText('Mapa de missões')).toBeInTheDocument()
  })

  it('runs the student program, updates the farm, records the attempt and opens the result', () => {
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.getByRole('log')).toHaveTextContent('Missão cumprida!')
    expect(useProgressStore.getState().save.missions['m1-first-harvest'].status).toBe('completed')
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('Tela de resultado')).toBeInTheDocument()
  })

  it('records the program that actually ran even if the workspace changes during the run', () => {
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Trocar programa' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    const attempt = useProgressStore.getState().save.attempts[0]
    expect(attempt.outcome).toBe('success')
    expect(attempt.blocks).toBe(8)
    expect(attempt.pseudocode).toContain('virar à direita')
  })

  it('starts the student program instead of resuming a paused demonstration', () => {
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('button', { name: /Ver demonstração/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.getByRole('log')).toHaveTextContent('Missão cumprida!')
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
  })

  it('stops a run and puts the farm back to its initial state', () => {
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    const initial = screen.getByRole('grid', { name: 'Mapa da fazenda' }).innerHTML
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }))
    expect(screen.getByRole('log')).toHaveTextContent('Execução interrompida')
    expect(screen.getByRole('grid', { name: 'Mapa da fazenda' }).innerHTML).toBe(initial)
  })

  it('launches a harvest flight toward the harvest counter when a plant is harvested', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, renderMode: '2d', motion: 'full' } })
    renderAt('/jogar/m1-first-harvest')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(useFlightStore.getState().flights.length + useFlightStore.getState().arrivals).toBeGreaterThan(0)
  })
})
