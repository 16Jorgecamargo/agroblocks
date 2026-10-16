import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createSignalBus } from '@/features/tutorial/signalBus'
import { TutorialOverlay, type TutorialFacts } from '@/features/tutorial/TutorialOverlay'
import type { SideTab, TutorialSignal } from '@/features/tutorial/tutorialTypes'
import type { ExecutionSnapshot } from '@/game/execution/types'

const snap = (status: ExecutionSnapshot['status'], success = false) =>
  ({ status, validation: status === 'finished' ? { success, objectives: [], constraints: [] } : null }) as unknown as ExecutionSnapshot

function setup(facts: TutorialFacts = { stackSize: 0, stepMode: false }) {
  const bus = createSignalBus<TutorialSignal>()
  const onSideTab = vi.fn<(tab: SideTab) => void>()
  const onExit = vi.fn()
  const view = render(<TutorialOverlay snapshot={snap('idle')} bus={bus} facts={facts} onSideTab={onSideTab} onExit={onExit} />)
  const rerender = (snapshot: ExecutionSnapshot, nextFacts = facts) =>
    view.rerender(<TutorialOverlay snapshot={snapshot} bus={bus} facts={nextFacts} onSideTab={onSideTab} onExit={onExit} />)
  const emit = (signal: TutorialSignal) => act(() => bus.emit(signal))
  return { bus, onSideTab, onExit, rerender, emit }
}

const progress = () => within(screen.getByRole('toolbar', { name: 'Tutorial' })).getByTestId('tutorial-progress').textContent
const practise = () => fireEvent.click(screen.getAllByRole('button', { name: 'Praticar' }).at(-1) as HTMLElement)

describe('TutorialOverlay', () => {
  it('runs the whole tutorial from welcome to the missions', () => {
    const { rerender, emit, onSideTab, onExit } = setup()
    expect(screen.getByRole('dialog', { name: 'Bem-vindo ao treinamento' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    expect(progress()).toBe('2/15')
    expect(screen.getByRole('dialog', { name: 'Objetivo da fase' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))

    expect(progress()).toBe('4/15')
    expect(screen.getByRole('dialog', { name: 'Como adicionar um bloco' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Próximo' })).not.toBeInTheDocument()
    practise()
    emit({ type: 'blockAdded' })
    expect(progress()).toBe('5/15')
    practise()
    emit({ type: 'stackSize', size: 2 })
    expect(progress()).toBe('6/15')
    practise()
    emit({ type: 'blockRemoved' })
    practise()
    emit({ type: 'tabOpened', tab: 'pseudocode' })
    expect(progress()).toBe('8/15')
    practise()
    rerender(snap('running'))
    expect(screen.getByRole('dialog', { name: 'Executar e Parar' })).toHaveTextContent('clique em Parar')
    rerender(snap('idle'))
    expect(progress()).toBe('9/15')
    practise()
    emit({ type: 'stepModeOn' })
    emit({ type: 'stepped' })
    practise()
    emit({ type: 'tabOpened', tab: 'hints' })
    emit({ type: 'hintRevealed' })
    expect(progress()).toBe('11/15')
    practise()
    rerender(snap('running'))
    rerender(snap('failed'))
    expect(progress()).toBe('12/15')
    expect(onSideTab).toHaveBeenLastCalledWith('console')
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    practise()
    rerender(snap('running'))
    rerender(snap('finished', true))
    expect(progress()).toBe('14/15')
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(screen.getByRole('dialog', { name: 'Treinamento concluído!' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ir para as missões' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('completes a step at once when its condition is already true on entry', () => {
    const { emit } = setup({ stackSize: 2, stepMode: false })
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    practise()
    emit({ type: 'blockAdded' })
    expect(progress()).toBe('6/15')
  })

  it('shows a notice when the run ends before Parar', () => {
    const { rerender, emit } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    for (let index = 0; index < 2; index += 1) fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    practise()
    emit({ type: 'blockAdded' })
    practise()
    emit({ type: 'stackSize', size: 2 })
    practise()
    emit({ type: 'blockRemoved' })
    practise()
    emit({ type: 'tabOpened', tab: 'pseudocode' })
    practise()
    rerender(snap('running'))
    rerender(snap('failed'))
    expect(progress()).toBe('8/15')
    expect(screen.getByRole('dialog', { name: 'Executar e Parar' })).toHaveTextContent('terminou antes')
  })

  it('asks before skipping the tutorial', () => {
    const { onExit } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }))
    const confirm = screen.getByRole('dialog', { name: 'Sair do treinamento?' })
    fireEvent.click(within(confirm).getByRole('button', { name: 'Continuar treinamento' }))
    expect(onExit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Pular tutorial' }))
    fireEvent.click(within(screen.getAllByRole('dialog', { name: 'Sair do treinamento?' }).at(-1) as HTMLElement).getByRole('button', { name: 'Sair do treinamento' }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('goes back with Anterior', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Começar treinamento' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(progress()).toBe('3/15')
    fireEvent.click(screen.getByRole('button', { name: 'Passo anterior' }))
    expect(progress()).toBe('2/15')
  })
})
