import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { GameplayPage } from '@/features/gameplay/GameplayPage'
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
        const mission = getMission('garden-04')
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
        <Route path="/avaliacao/pre" element={<p>Avaliação inicial</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GameplayPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'reduced' } })
    useProgressStore.getState().resetProgress()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('swaps the side panel at once when changing tabs, without an empty gap', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full' } })
    renderAt('/jogar/garden-04')
    fireEvent.click(screen.getByRole('tab', { name: 'Dicas' }))
    const panels = screen.getAllByRole('tabpanel', { hidden: true }).filter((panel) => panel.id.startsWith('side-panel'))
    expect(panels.map((panel) => panel.id)).toEqual(['side-panel-hints'])
  })

  it('widens the farm and narrows the program while running, then restores the layout', () => {
    renderAt('/jogar/garden-04')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    const body = document.querySelector('.gameplay__body') as HTMLElement
    expect(body).toHaveAttribute('data-running', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    expect(body).toHaveAttribute('data-running', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }))
    expect(body).toHaveAttribute('data-running', 'false')
  })

  it('redirects locked missions to the mission map', () => {
    renderAt('/jogar/homestead-10')
    expect(screen.getByText('Mapa de missões')).toBeInTheDocument()
  })

  it('runs the student program, updates the farm, records the attempt and opens the result', () => {
    renderAt('/jogar/garden-04')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.getByRole('log')).toHaveTextContent('Missão cumprida!')
    expect(useProgressStore.getState().save.missions['garden-04'].status).toBe('completed')
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('Tela de resultado')).toBeInTheDocument()
  })

  it('records the program that actually ran even if the workspace changes during the run', () => {
    renderAt('/jogar/garden-04')
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

  it('shows the demonstration in its own dialog and leaves the program and console untouched', () => {
    renderAt('/jogar/garden-04')
    fireEvent.click(screen.getByRole('button', { name: /Ver demonstração/ }))
    expect(screen.getByRole('dialog', { name: 'Demonstração' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Demonstração: o robô na fazenda' })).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('log')).not.toHaveTextContent('Demonstração')
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Demonstração' })).getByRole('button', { name: 'Voltar' }))
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByRole('heading', { name: 'Objetivo' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Ver demonstração/ }))
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Demonstração' })).getByRole('button', { name: 'Começar' }))
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.getByRole('log')).toHaveTextContent('Missão cumprida!')
    expect(useProgressStore.getState().save.attempts).toHaveLength(1)
  })

  it('stops a run and puts the farm back to its initial state', () => {
    renderAt('/jogar/garden-04')
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
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, motion: 'full' } })
    renderAt('/jogar/garden-04')
    fireEvent.click(screen.getByRole('button', { name: 'Começar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(useFlightStore.getState().flights.length + useFlightStore.getState().arrivals).toBeGreaterThan(0)
  })

  it('opens the training with the tutorial welcome instead of the briefing', () => {
    renderAt('/jogar/m0-training')
    expect(screen.getByRole('dialog', { name: 'Bem-vindo ao treinamento' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Objetivo' })).not.toBeInTheDocument()
  })

  it('marks the real screen areas the tutorial points at', () => {
    renderAt('/jogar/m0-training')
    for (const target of ['hud-goal', 'hud-harvest', 'hud-actions', 'farm', 'editor', 'execution', 'side']) {
      expect(document.querySelector(`[data-tutorial="${target}"]`)).not.toBeNull()
    }
  })

  it('skips the block steps already done by the saved program when the training is repeated', () => {
    useProgressStore.setState((state) => ({
      save: { ...state.save, missions: { ...state.save.missions, 'm0-training': { ...state.save.missions['m0-training'], hintsUsed: 3 } } },
    }))
    renderAt('/jogar/m0-training')
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    for (let index = 0; index < 2; index += 1) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(screen.getByTestId('tutorial-progress')).toHaveTextContent('6/15')
  })

  it('sends a registered student to the pre-test before any phase', () => {
    useProgressStore.getState().startRun({ name: 'Ana Souza', school: 'Escola Azul' })
    renderAt('/jogar/m0-training')
    expect(screen.getByText('Avaliação inicial')).toBeInTheDocument()
  })

  it('records a skipped tutorial on the run', () => {
    useProgressStore.getState().startRun({ name: 'Ana Souza', school: 'Escola Azul' })
    useProgressStore.getState().storeAssessment({ form: 'pre', startedAt: 'a', completedAt: 'b', skipped: false, answers: {} })
    renderAt('/jogar/m0-training')
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }))
    fireEvent.click(within(screen.getAllByRole('dialog', { name: 'Sair do treinamento?' }).at(-1) as HTMLElement).getByRole('button', { name: 'Sair do treinamento' }))
    expect(useProgressStore.getState().save.tutorial).toMatchObject({ status: 'skipped', step: 2 })
  })
})
