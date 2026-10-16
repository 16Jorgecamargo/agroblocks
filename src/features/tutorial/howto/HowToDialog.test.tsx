import { fireEvent, render, screen } from '@testing-library/react'
import { HowToDialog } from '@/features/tutorial/howto/HowToDialog'
import { HOWTO_SCRIPTS } from '@/features/tutorial/howto/howtoScripts'
import { useSettingsStore } from '@/stores/settingsStore'

describe('HowToDialog', () => {
  afterEach(() => useSettingsStore.getState().update({ motion: 'full' }))

  it('shows the script title, the first caption and the replica', () => {
    render(<HowToDialog open howTo="add-block" onPractice={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'Como adicionar um bloco' })).toBeInTheDocument()
    expect(screen.getByText(HOWTO_SCRIPTS['add-block'].segments[0].caption)).toBeInTheDocument()
    expect(document.querySelector('.howto-stage .replica')).not.toBeNull()
    expect(document.querySelector('.howto-hand')).not.toBeNull()
  })

  it('switches between the three ways to delete a block', () => {
    render(<HowToDialog open howTo="delete-block" onPractice={vi.fn()} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Lixeira', 'Biblioteca', 'Delete'])
    fireEvent.click(screen.getByRole('tab', { name: 'Delete' }))
    expect(screen.getByRole('tab', { name: 'Delete' })).toHaveAttribute('aria-selected', 'true')
    expect(document.querySelector('.howto-stage')).toHaveAttribute('data-segment', '2')
    expect(screen.getByText(HOWTO_SCRIPTS['delete-block'].segments[2].caption)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver de novo' }))
    expect(document.querySelector('.howto-stage')).toHaveAttribute('data-segment', '0')
  })

  it('hands control back with Praticar', () => {
    const onPractice = vi.fn()
    render(<HowToDialog open howTo="hints" onPractice={onPractice} />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Praticar' }))
    expect(onPractice).toHaveBeenCalledTimes(1)
  })

  it('shows still frames with arrows when motion is reduced', () => {
    useSettingsStore.getState().update({ motion: 'reduced' })
    render(<HowToDialog open howTo="add-block" onPractice={vi.fn()} />)
    const stage = document.querySelector('.howto-stage')
    expect(stage).toHaveAttribute('data-frame', '0')
    fireEvent.click(screen.getByRole('button', { name: 'Próximo quadro' }))
    expect(stage).toHaveAttribute('data-frame', '1')
    fireEvent.click(screen.getByRole('button', { name: 'Quadro anterior' }))
    expect(stage).toHaveAttribute('data-frame', '0')
  })
})
