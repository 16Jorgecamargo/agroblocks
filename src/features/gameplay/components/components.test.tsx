import { fireEvent, render, screen } from '@testing-library/react'
import { GameHud } from '@/features/gameplay/components/GameHud'
import { ExecutionPanel } from '@/features/gameplay/components/ExecutionPanel'
import { ConsolePanel } from '@/features/gameplay/components/ConsolePanel'
import { HintsPanel } from '@/features/gameplay/components/HintsPanel'
import { getMission } from '@/data/missions'

const mission = getMission('cornfield-02')
if (!mission) throw new Error('mission missing')

const panelProps = {
  speed: 1 as const,
  stepMode: false,
  onRun: vi.fn(),
  onStep: vi.fn(),
  onStop: vi.fn(),
  onSpeedChange: vi.fn(),
  onStepModeChange: vi.fn(),
}

describe('gameplay components', () => {
  it('shows mission info and real resource values in the HUD', () => {
    render(
      <GameHud
        mission={mission}
        resources={{ seeds: 5, water: null, energy: 20, harvested: 0 }}
        onHelp={vi.fn()}
        onSettings={vi.fn()}
        onExit={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Fase 12 - Plantação em série' })).toBeInTheDocument()
    expect(screen.getByLabelText('Sementes: 5')).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Água/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('turns Executar into a red Parar while the program runs', () => {
    const { rerender } = render(<ExecutionPanel {...panelProps} status="idle" />)
    expect(screen.getByRole('button', { name: 'Executar' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Parar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pausar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reiniciar' })).not.toBeInTheDocument()

    rerender(<ExecutionPanel {...panelProps} status="running" />)
    expect(screen.queryByRole('button', { name: 'Executar' })).not.toBeInTheDocument()
    const stop = screen.getByRole('button', { name: 'Parar' })
    expect(stop).toHaveClass('game-button--danger')
    fireEvent.click(stop)
    expect(panelProps.onStop).toHaveBeenCalled()

    rerender(<ExecutionPanel {...panelProps} status="finished" />)
    expect(screen.getByRole('button', { name: 'Executar' })).toBeEnabled()
  })

  it('splits into Próximo and Parar side by side once a step run starts', () => {
    const onStep = vi.fn()
    const onStop = vi.fn()
    const { rerender } = render(<ExecutionPanel {...panelProps} onStep={onStep} onStop={onStop} status="idle" stepMode />)
    fireEvent.click(screen.getByRole('button', { name: 'Executar' }))
    expect(onStep).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Parar' })).not.toBeInTheDocument()

    rerender(<ExecutionPanel {...panelProps} onStep={onStep} onStop={onStop} status="paused" stepMode />)
    const split = screen.getByRole('group', { name: 'Controles do passo a passo' })
    expect([...split.querySelectorAll('button')].map((button) => button.textContent?.trim())).toEqual(['Próximo', 'Parar'])
    expect(split.querySelectorAll('.execution-panel__slot')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Parar' }))
    expect(onStep).toHaveBeenCalledTimes(2)
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('drops the status, command counter and current block readouts', () => {
    render(<ExecutionPanel {...panelProps} status="running" />)
    expect(screen.queryByText('Estado')).not.toBeInTheDocument()
    expect(screen.queryByText('Comandos executados')).not.toBeInTheDocument()
    expect(screen.queryByText('Bloco atual')).not.toBeInTheDocument()
  })

  it('turns the main button into a single step in step mode', () => {
    render(<ExecutionPanel {...panelProps} status="paused" stepMode />)
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(panelProps.onStep).toHaveBeenCalled()
  })

  it('animates new console entries but not the ones already shown', () => {
    const { container, rerender } = render(<ConsolePanel entries={[{ id: 1, kind: 'info', text: 'A' }]} onClear={vi.fn()} />)
    expect(container.querySelector('[data-new="true"]')).toBeNull()
    rerender(<ConsolePanel entries={[{ id: 1, kind: 'info', text: 'A' }, { id: 2, kind: 'success', text: 'B' }]} onClear={vi.fn()} />)
    expect(container.querySelector('[data-new="true"]')).toHaveTextContent('B')
  })

  it('maps the speed slider to the four speeds', () => {
    render(<ExecutionPanel {...panelProps} status="idle" />)
    fireEvent.change(screen.getByRole('slider', { name: 'Velocidade' }), { target: { value: '3' } })
    expect(panelProps.onSpeedChange).toHaveBeenCalledWith(4)
  })

  it('renders console entries with a non-color marker', () => {
    render(<ConsolePanel entries={[{ id: 1, kind: 'error', text: 'Bateu.' }]} onClear={vi.fn()} />)
    expect(screen.getByRole('log')).toHaveTextContent('✕ Bateu.')
  })

  it('reveals hints progressively and explains the lock', () => {
    const onReveal = vi.fn()
    render(<HintsPanel hints={mission.hints} revealed={3} canReveal={false} failedAttempts={1} onReveal={onReveal} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('button', { name: /Pedir dica/ })).toBeDisabled()
    expect(screen.getByText(/depois de 2 tentativas/)).toBeInTheDocument()
  })
})
