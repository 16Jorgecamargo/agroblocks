import { fireEvent, render, screen } from '@testing-library/react'
import { HowToDialog } from '@/features/tutorial/howto/HowToDialog'
import { HOWTO_CLIPS } from '@/features/tutorial/howto/howtoClips'
import { useSettingsStore } from '@/stores/settingsStore'

const video = () => document.querySelector('.howto-video video') as HTMLVideoElement

describe('HowToDialog', () => {
  afterEach(() => useSettingsStore.getState().update({ motion: 'full' }))

  it('plays the recorded clip of the real screen with its caption', () => {
    render(<HowToDialog open howTo="add-block" onPractice={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'Como adicionar um bloco' })).toBeInTheDocument()
    expect(screen.getByText(HOWTO_CLIPS['add-block'].clips[0].caption)).toBeInTheDocument()
    expect(video().getAttribute('src')).toMatch(/howto\/add-block\.webm$/)
    expect(video().getAttribute('poster')).toMatch(/howto\/add-block\.jpg$/)
    expect(video().autoplay).toBe(true)
    expect(video().loop).toBe(true)
    expect(video().muted).toBe(true)
  })

  it('switches between the three ways to delete a block', () => {
    render(<HowToDialog open howTo="delete-block" onPractice={vi.fn()} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Lixeira', 'Biblioteca', 'Tecla Delete'])
    expect(video().loop).toBe(false)
    fireEvent.click(screen.getByRole('tab', { name: 'Tecla Delete' }))
    expect(screen.getByRole('tab', { name: 'Tecla Delete' })).toHaveAttribute('aria-selected', 'true')
    expect(video().getAttribute('src')).toMatch(/howto\/delete-key\.webm$/)
    expect(screen.getByText(HOWTO_CLIPS['delete-block'].clips[2].caption)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver de novo' }))
    expect(video().getAttribute('src')).toMatch(/howto\/delete-trash\.webm$/)
  })

  it('moves to the next way when a clip ends and wraps around', () => {
    render(<HowToDialog open howTo="delete-block" onPractice={vi.fn()} />)
    fireEvent.ended(video())
    expect(video().getAttribute('src')).toMatch(/howto\/delete-library\.webm$/)
    fireEvent.ended(video())
    fireEvent.ended(video())
    expect(video().getAttribute('src')).toMatch(/howto\/delete-trash\.webm$/)
  })

  it('hands control back with Praticar', () => {
    const onPractice = vi.fn()
    render(<HowToDialog open howTo="hints" onPractice={onPractice} />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Praticar' }))
    expect(onPractice).toHaveBeenCalledTimes(1)
  })

  it('waits on the poster with player controls when motion is reduced', () => {
    useSettingsStore.getState().update({ motion: 'reduced' })
    render(<HowToDialog open howTo="add-block" onPractice={vi.fn()} />)
    expect(video().autoplay).toBe(false)
    expect(video().controls).toBe(true)
  })
})
